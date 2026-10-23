const WIDTH = 1200
const HEIGHT = 330
const PADDING_X = 48
const CHART_TOP = 130
const CHART_BOTTOM = 270
const MONTH_LABEL_Y = 300
const MIN_MONTH_LABEL_GAP = 60
const CURVE_TENSION = 6

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const FONT_STACK = "'Space Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace"

/**
 * @typedef {{ date: string, contributionCount: number }} ContributionDay
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
 * @param {ContributionWeek[]} weeks
 */
export function summarizeContributions(weeks) {
  const days = weeks.flatMap((week) => week.contributionDays)

  const weeklyTotals = weeks.map((week) => ({
    startDate: week.contributionDays[0]?.date ?? '',
    total: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
  }))

  return {
    total: days.reduce((sum, day) => sum + day.contributionCount, 0),
    longestStreak: findLongestStreak(days),
    currentStreak: findCurrentStreak(days),
    weeklyTotals,
  }
}

/**
 * Smooth curve through the points (Catmull-Rom converted to cubic Béziers).
 * Control points are clamped to the baseline so the curve never dips below zero.
 * @param {{ x: number, y: number }[]} points
 */
function buildSmoothPath(points) {
  const clampY = (y) => Math.min(y, CHART_BOTTOM)

  const segments = points.slice(1).map((point, index) => {
    const previous = points[index]
    const beforePrevious = points[index - 1] ?? previous
    const next = points[index + 2] ?? point

    const control1X = previous.x + (point.x - beforePrevious.x) / CURVE_TENSION
    const control1Y = clampY(previous.y + (point.y - beforePrevious.y) / CURVE_TENSION)
    const control2X = point.x - (next.x - previous.x) / CURVE_TENSION
    const control2Y = clampY(point.y - (next.y - previous.y) / CURVE_TENSION)

    return `C ${control1X.toFixed(1)} ${control1Y.toFixed(1)} ${control2X.toFixed(1)} ${control2Y.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  })

  return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} ${segments.join(' ')}`
}

/**
 * @param {{ startDate: string }[]} weeklyTotals
 * @param {(index: number) => number} xForIndex
 */
function buildMonthLabels(weeklyTotals, xForIndex) {
  const labels = []
  let previousMonth = -1

  weeklyTotals.forEach((week, index) => {
    const month = new Date(`${week.startDate}T00:00:00Z`).getUTCMonth()
    const x = xForIndex(index)
    const lastLabel = labels.at(-1)
    const hasRoom = !lastLabel || x - lastLabel.x >= MIN_MONTH_LABEL_GAP

    if (month !== previousMonth && index > 0 && hasRoom) {
      labels.push({ x, text: MONTH_NAMES[month] })
    }

    previousMonth = month
  })

  return labels
}

/**
 * @param {number} value
 * @param {string} singular
 */
function pluralize(value, singular) {
  return `${value.toLocaleString('en-US')} ${singular}${value === 1 ? '' : 's'}`
}

/**
 * @param {{ x: number, y: number }} point
 * @param {number} total
 */
function renderPeakMarker(point, total) {
  const labelAnchor = point.x > WIDTH - 160 ? 'end' : 'middle'

  return `<g class="area">
  <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5" fill="#0a1216" stroke="#f2f2f2" stroke-width="2.5" />
  <text x="${point.x.toFixed(1)}" y="${(point.y - 14).toFixed(1)}" text-anchor="${labelAnchor}" class="mono" font-size="13" fill="#f2f2f2">peak week: ${total}</text>
  </g>`
}

/**
 * @param {ReturnType<typeof summarizeContributions>} summary
 */
export function renderActivityChart(summary) {
  const { weeklyTotals } = summary
  const peakTotal = Math.max(0, ...weeklyTotals.map((week) => week.total))
  const maxWeekly = Math.max(1, peakTotal)
  const stepX = (WIDTH - PADDING_X * 2) / Math.max(1, weeklyTotals.length - 1)

  const xForIndex = (index) => PADDING_X + index * stepX
  const yForTotal = (total) => CHART_BOTTOM - (total / maxWeekly) * (CHART_BOTTOM - CHART_TOP)

  const points = weeklyTotals.map((week, index) => ({ x: xForIndex(index), y: yForTotal(week.total) }))
  const linePath = buildSmoothPath(points)
  const areaPath = `${linePath} L ${points.at(-1).x.toFixed(1)} ${CHART_BOTTOM} L ${points[0].x.toFixed(1)} ${CHART_BOTTOM} Z`

  const peakMarker = peakTotal > 0
    ? renderPeakMarker(points[weeklyTotals.findIndex((week) => week.total === peakTotal)], peakTotal)
    : ''

  const gridLines = [0.5, 1]
    .map((ratio) => CHART_BOTTOM - ratio * (CHART_BOTTOM - CHART_TOP))
    .map((y) => `<line x1="${PADDING_X}" y1="${y}" x2="${WIDTH - PADDING_X}" y2="${y}" stroke="#212629" stroke-dasharray="4 6" />`)
    .join('\n  ')

  const monthLabels = buildMonthLabels(weeklyTotals, xForIndex)
    .map((label) => `<text x="${label.x.toFixed(1)}" y="${MONTH_LABEL_Y}" text-anchor="middle" class="mono" font-size="13" fill="#7a7a7a">${label.text}</text>`)
    .join('\n  ')

  const stats = [
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title">
  <title id="title">${summary.total} contributions in the last 12 months, current streak ${summary.currentStreak} days, longest streak ${summary.longestStreak} days</title>

  <defs>
    <style>
      .mono { font-family: ${FONT_STACK}; }
      .line { stroke-dasharray: 1; animation: draw 2.4s ease-out both; }
      .area { animation: fade 2.4s ease-in both; }
      @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    </style>

    <linearGradient id="line-gradient" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#f72585" />
      <stop offset="0.5" stop-color="#826aed" />
      <stop offset="1" stop-color="#4cc9f0" />
    </linearGradient>

    <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#f72585" stop-opacity="0.35" />
      <stop offset="1" stop-color="#f72585" stop-opacity="0" />
    </linearGradient>

    <filter id="glow" x="-5%" y="-30%" width="110%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" rx="14" fill="#0a1216" stroke="#212629" stroke-width="2" />

  ${stats}

  ${gridLines}
  <line x1="${PADDING_X}" y1="${CHART_BOTTOM}" x2="${WIDTH - PADDING_X}" y2="${CHART_BOTTOM}" stroke="#2c3438" />

  <path class="area" d="${areaPath}" fill="url(#area-gradient)" />
  <path class="line" d="${linePath}" pathLength="1" fill="none" stroke="url(#line-gradient)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" />

  ${peakMarker}

  ${monthLabels}
</svg>
`
}
