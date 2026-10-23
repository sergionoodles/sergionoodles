import { writeFile } from 'node:fs/promises'
import { renderActivityChart, summarizeContributions } from './activity-chart.mjs'

const GRAPHQL_URL = 'https://api.github.com/graphql'
const OUTPUT_PATH = new URL('../assets/activity.svg', import.meta.url)

const CALENDAR_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays { date contributionCount contributionLevel }
          }
        }
      }
    }
  }
`

async function fetchContributionWeeks(login, token) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: CALENDAR_QUERY, variables: { login } }),
  })

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status} ${await response.text()}`)
  }

  const { data, errors } = await response.json()

  if (errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(errors)}`)
  }

  return data.user.contributionsCollection.contributionCalendar.weeks
}

const login = process.env.GITHUB_USER
const token = process.env.GITHUB_TOKEN

if (!login || !token) {
  throw new Error('Set GITHUB_USER and GITHUB_TOKEN')
}

const weeks = await fetchContributionWeeks(login, token)
const summary = summarizeContributions(weeks)

await writeFile(OUTPUT_PATH, renderActivityChart(summary))

console.log(`Wrote ${OUTPUT_PATH.pathname}: ${summary.total} contributions`)
