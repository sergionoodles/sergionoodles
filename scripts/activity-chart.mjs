const WIDTH = 1200
const HEIGHT = 340
const PADDING_X = 48
const DAY_LABEL_WIDTH = 44
const GRID_LEFT = PADDING_X + DAY_LABEL_WIDTH
const GRID_TOP = 152
const CELL_SIZE = 16
const CELL_GAP = 4
const CELL_PITCH = CELL_SIZE + CELL_GAP
const DAYS_PER_WEEK = 7
const MONTH_LABEL_Y = GRID_TOP - 12
const MIN_MONTH_LABEL_COLUMNS = 3
const FOOTER_Y = GRID_TOP + DAYS_PER_WEEK * CELL_PITCH + 26

const COLUMN_REVEAL_DELAY = 0.03
const ROW_REVEAL_DELAY = 0.02
const PULSE_DURATION = 2.8
const SCAN_DURATION = 7
const SCAN_WIDTH = 80

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DAY_LABELS = [
  { row: 1, text: 'mon' },
  { row: 3, text: 'wed' },
  { row: 5, text: 'fri' },
]

const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE']
const LEVEL_COLORS = ['#161f24', '#4d1236', '#8e1a5a', '#c81f72', '#f72585']
const TOP_LEVEL = LEVELS.length - 1

const FONT_STACK = "'Space Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace"

/**
 * @typedef {{ date: string, contributionCount: number, contributionLevel?: string }} ContributionDay
 * @typedef {{ contributionDays: ContributionDay[] }} ContributionWeek
 */

/**
 * Counts consecutive active days ending at `endIndex`, walking backwards.
 * @param {ContributionDay[]} days
 * @param {number} endIndex
 */
function countStreakEndingAt(days, endIndex) {
  let length = 0

  for (let index = endIndex; index >= 0 && days[index].contributionCount > 0; index--) {
    length++
  }

  return length
}

/**
 * @param {ContributionDay[]} days
 */
function findLongestStreak(days) {
  let longest = 0
  let current = 0

  for (const day of days) {
    current = day.contributionCount > 0 ? current + 1 : 0
    longest = Math.max(longest, current)
  }

  return longest
}

/**
 * The calendar's last day is today, which is still in progress, so an empty
 * today doesn't break a streak that ran through yesterday.
 * @param {ContributionDay[]} days
 */
function findCurrentStreak(days) {
  if (days.length === 0) {
    return 0
  }

  const lastIndex = days.length - 1
  const isTodayEmpty = days[lastIndex].contributionCount === 0

  return countStreakEndingAt(days, isTodayEmpty ? lastIndex - 1 : lastIndex)
}

/**
 * @param {ContributionDay} day
 */
function toLevelIndex(day) {
  const index = LEVELS.indexOf(day.contributionLevel ?? '')

  if (index >= 0) {
    return index
  }

  return day.contributionCount > 0 ? 1 : 0
}

/**
 * @param {ContributionWeek[]} weeks
 */
export function summarizeContributions(weeks) {
  const days = weeks.flatMap((week) => week.contributionDays)

  const calendar = weeks.map((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: toLevelIndex(day),
    })),
  )

  return {
    total: days.reduce((sum, day) => sum + day.contributionCount, 0),
    longestStreak: findLongestStreak(days),
    currentStreak: findCurrentStreak(days),
    lastDate: days.at(-1)?.date ?? '',
    calendar,
  }
}

/**
 * @param {string} date
 */
function parseUtcDate(date) {
  return new Date(`${date}T00:00:00Z`)
}

/**
 * @param {ReturnType<typeof summarizeContributions>['calendar']} calendar
 */
function renderMonthLabels(calendar) {
  const labels = []
  let previousMonth = -1

  calendar.forEach((week, column) => {
    const firstDay = week[0]

    if (!firstDay) {
      return
    }

    const month = parseUtcDate(firstDay.date).getUTCMonth()
    const lastLabel = labels.at(-1)
    const hasRoom = !lastLabel || column - lastLabel.column >= MIN_MONTH_LABEL_COLUMNS

    if (month !== previousMonth && column > 0 && hasRoom) {
      labels.push({ column, text: MONTH_NAMES[month] })
    }

    previousMonth = month
  })

  return labels
    .map((label) => `<text x="${GRID_LEFT + label.column * CELL_PITCH}" y="${MONTH_LABEL_Y}" class="mono label">${label.text}</text>`)
    .join('\n  ')
}

function renderDayLabels() {
  return DAY_LABELS
    .map((label) => {
      const y = GRID_TOP + label.row * CELL_PITCH + CELL_SIZE - 3

      return `<text x="${PADDING_X}" y="${y}" class="mono label">${label.text}</text>`
    })
    .join('\n  ')
}

/**
 * Cells reveal in a wave from left to right; the busiest days keep pulsing.
 * @param {ReturnType<typeof summarizeContributions>['calendar']} calendar
 */
function renderCells(calendar) {
  return calendar
    .flatMap((week, column) =>
      week.map((day) => {
        const row = parseUtcDate(day.date).getUTCDay()
        const x = GRID_LEFT + column * CELL_PITCH
        const y = GRID_TOP + row * CELL_PITCH
        const revealDelay = (column * COLUMN_REVEAL_DELAY + row * ROW_REVEAL_DELAY).toFixed(2)
        const isTopLevel = day.level === TOP_LEVEL
        const pulseDelay = (((column + row) % DAYS_PER_WEEK) * (PULSE_DURATION / DAYS_PER_WEEK)).toFixed(2)
        const delays = isTopLevel ? `${revealDelay}s, ${pulseDelay}s` : `${revealDelay}s`
        const plural = day.count === 1 ? '' : 's'

        return `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="3" class="cell l${day.level}" style="animation-delay: ${delays}"><title>${day.count} contribution${plural} on ${day.date}</title></rect>`
      }),
    )
    .join('\n  ')
}

function renderLegend() {
  const swatchesWidth = LEVEL_COLORS.length * CELL_PITCH
  const moreLabelWidth = 40
  const swatchesLeft = WIDTH - PADDING_X - moreLabelWidth - swatchesWidth

  const swatches = LEVEL_COLORS
    .map((color, index) => `<rect x="${swatchesLeft + index * CELL_PITCH}" y="${FOOTER_Y - 12}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="3" fill="${color}" />`)
    .join('\n  ')

  return `<text x="${swatchesLeft - 10}" y="${FOOTER_Y}" text-anchor="end" class="mono label">less</text>
  ${swatches}
  <text x="${WIDTH - PADDING_X}" y="${FOOTER_Y}" text-anchor="end" class="mono label">more</text>`
}

/**
 * @param {number} value
 * @param {string} singular
 */
function pluralize(value, singular) {
  return `${value.toLocaleString('en-US')} ${singular}${value === 1 ? '' : 's'}`
}

/**
 * @param {ReturnType<typeof summarizeContributions>} summary
 */
function renderStats(summary) {
  return [
    { value: summary.total.toLocaleString('en-US'), label: 'contributions, last 12 months', color: '#f72585' },
    { value: pluralize(summary.currentStreak, 'day'), label: 'current streak', color: '#4cc9f0' },
    { value: pluralize(summary.longestStreak, 'day'), label: 'longest streak', color: '#826aed' },
  ]
    .map((stat, index) => {
      const x = PADDING_X + index * 380

      return `<text x="${x}" y="66" class="mono" font-size="32" font-weight="700" fill="${stat.color}">${stat.value}</text>
  <text x="${x}" y="92" class="mono" font-size="14" fill="#c4c4c4">${stat.label}</text>`
    })
    .join('\n  ')
}

/**
 * @param {ReturnType<typeof summarizeContributions>} summary
 */
export function renderActivityChart(summary) {
  const gridWidth = summary.calendar.length * CELL_PITCH - CELL_GAP
  const gridHeight = DAYS_PER_WEEK * CELL_PITCH - CELL_GAP

  const levelStyles = LEVEL_COLORS
    .map((color, index) => `.l${index} { fill: ${color}; }`)
    .join('\n      ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title">
  <title id="title">${summary.total} contributions in the last 12 months, current streak ${summary.currentStreak} days, longest streak ${summary.longestStreak} days</title>

  <defs>
    <style>
      .mono { font-family: ${FONT_STACK}; }
      .label { font-size: 13px; fill: #7a7a7a; }
      .cell { transform-box: fill-box; transform-origin: center; animation: pop 0.5s ease-out both; }
      .l${TOP_LEVEL} { animation: pop 0.5s ease-out both, pulse ${PULSE_DURATION}s ease-in-out infinite; }
      ${levelStyles}
      .scan { animation: scan ${SCAN_DURATION}s linear infinite; }
      @keyframes pop { from { opacity: 0; transform: scale(0.3); } }
      @keyframes pulse { 50% { fill: #ff7ab8; } }
      @keyframes scan {
        from { transform: translateX(0); }
        to { transform: translateX(${gridWidth + SCAN_WIDTH}px); }
      }
    </style>

    <linearGradient id="scan-gradient" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#4cc9f0" stop-opacity="0" />
      <stop offset="0.85" stop-color="#4cc9f0" stop-opacity="0.18" />
      <stop offset="1" stop-color="#4cc9f0" stop-opacity="0.5" />
    </linearGradient>

    <clipPath id="grid-area">
      <rect x="${GRID_LEFT}" y="${GRID_TOP - 4}" width="${gridWidth}" height="${gridHeight + 8}" />
    </clipPath>

    <filter id="glow" x="-5%" y="-20%" width="110%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" rx="14" fill="#0a1216" stroke="#212629" stroke-width="2" />

  ${renderStats(summary)}

  ${renderMonthLabels(summary.calendar)}
  ${renderDayLabels()}

  <g filter="url(#glow)">
  ${renderCells(summary.calendar)}
  </g>

  <g clip-path="url(#grid-area)">
    <rect class="scan" x="${GRID_LEFT - SCAN_WIDTH}" y="${GRID_TOP - 4}" width="${SCAN_WIDTH}" height="${gridHeight + 8}" fill="url(#scan-gradient)" />
  </g>

  <text x="${GRID_LEFT}" y="${FOOTER_Y}" class="mono label">last sync ${summary.lastDate}</text>
  ${renderLegend()}
</svg>
`
}
