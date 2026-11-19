import { useEffect, useState } from 'react'

// Pulls created / last push / latest release from the public GitHub API.
// Falls back to the values in data.js if the API is down or rate-limited.
export function useRepoStats(title) {
  const fallback = { started: title.started, pushed: title.pushed, version: title.version }
  const [stats, setStats] = useState(fallback)

  useEffect(() => {
    let cancelled = false
    const key = 'repo:' + title.repo
    try {
      const cached = JSON.parse(sessionStorage.getItem(key))
      if (cached) {
        setStats(cached)
        return
      }
    } catch {
      /* storage blocked */
    }
    setStats(fallback)
    const api = 'https://api.github.com/repos/' + title.repo
    const get = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    Promise.all([get(api), get(api + '/releases/latest')]).then(([repo, release]) => {
      if (cancelled || !repo) return
      const live = {
        started: repo.created_at,
        pushed: repo.pushed_at,
        version: release?.tag_name || title.version,
      }
      setStats(live)
      try {
        sessionStorage.setItem(key, JSON.stringify(live))
      } catch {
        /* storage blocked */
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title.repo])

  return stats
}

const DAY = 86400000
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const daysSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso)) / DAY))

export const shortDate = (iso) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export const ago = (iso) => {
  const n = daysSince(iso)
  return n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`
}
