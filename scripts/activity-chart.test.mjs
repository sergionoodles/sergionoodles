import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderActivityChart, summarizeContributions } from './activity-chart.mjs'

function buildWeeks(counts, startDate = '2026-01-04') {
  const start = new Date(`${startDate}T00:00:00Z`)

  const days = counts.map((contributionCount, index) => {
    const date = new Date(start.getTime() + index * 86_400_000)

    return { date: date.toISOString().slice(0, 10), contributionCount }
  })

  const weeks = []

  for (let index = 0; index < days.length; index += 7) {
    weeks.push({ contributionDays: days.slice(index, index + 7) })
  }

  return weeks
}

test('summarizes totals, weekly sums and the longest streak', () => {
  const weeks = buildWeeks([1, 2, 0, 3, 3, 3, 0, 5, 0, 0, 0, 0, 0, 1])

  const summary = summarizeContributions(weeks)

  assert.equal(summary.total, 18)
  assert.deepEqual(
    summary.weeklyTotals.map((week) => week.total),
    [12, 6],
  )
  assert.equal(summary.longestStreak, 3)
})

test('an empty today does not break the current streak', () => {
  const summary = summarizeContributions(buildWeeks([0, 4, 1, 2, 0]))

  assert.equal(summary.currentStreak, 3)
})

test('current streak is zero when yesterday and today are empty', () => {
  const summary = summarizeContributions(buildWeeks([3, 3, 0, 0]))

  assert.equal(summary.currentStreak, 0)
})

test('renders a chart even when there are no contributions', () => {
  const svg = renderActivityChart(summarizeContributions(buildWeeks(new Array(21).fill(0))))

  assert.match(svg, /^<svg /)
  assert.doesNotMatch(svg, /NaN|Infinity/)
  assert.match(svg, /0 contributions in the last 12 months/)
})
