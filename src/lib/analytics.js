import api from '@/lib/api'
import { previousSiteDayRange, rangeForCalendarDate, siteDayRange } from '@/lib/time'

const post = (path, body) => api.post(path, body).then((res) => res.data)

export function fetchSites() {
  return api.get('/api/sites').then((res) => res.data)
}

function selectedRange(site, dateKey) {
  return dateKey ? rangeForCalendarDate(site.timezone, dateKey) : siteDayRange(site.timezone)
}

export function fetchEntries(site, pageNumber, pageSize = 10, dateKey) {
  return post('/api/analytics/entry-exit', {
    siteId: site.siteId,
    ...selectedRange(site, dateKey),
    pageNumber,
    pageSize,
  })
}

function hourOf(localValue) {
  const match = String(localValue || '').match(/(\d{2}):/)
  return match ? Number(match[1]) : null
}

function openHours(buckets) {
  const now = Date.now()
  const done = (buckets || []).filter((bucket) => bucket.utc <= now)
  const day = done.filter((bucket) => (hourOf(bucket.local) ?? -1) >= 8)
  return day.length ? day : done
}

function chartTime(localValue) {
  const hour = hourOf(localValue)
  return hour == null ? '' : `${hour}:00`
}

export function occupancyPoints(buckets) {
  return openHours(buckets).map((bucket) => ({
    time: chartTime(bucket.local),
    occupancy: Math.round(bucket.avg || 0),
  }))
}

export function demographicPoints(buckets) {
  return openHours(buckets).map((bucket) => ({
    time: chartTime(bucket.local),
    male: Math.round(bucket.male || 0),
    female: Math.round(bucket.female || 0),
  }))
}

export function previousOccupancyAverage(buckets) {
  const samples = openHours(buckets)
    .map((bucket) => bucket.avg)
    .filter((value) => value > 0)
  if (!samples.length) return 0
  return samples.reduce((sum, value) => sum + value, 0) / samples.length
}

export function overviewRequests(site, dateKey) {
  const today = selectedRange(site, dateKey)
  const yesterday = previousSiteDayRange(site.timezone, new Date(today.fromUtc))
  const call = (path, range) => post(path, { siteId: site.siteId, ...range })

  // not bundled into Promise.all — each card renders when its own call comes back
  return {
    footfall: call('/api/analytics/footfall', today),
    previousFootfall: call('/api/analytics/footfall', yesterday),
    dwell: call('/api/analytics/dwell', today),
    previousDwell: call('/api/analytics/dwell', yesterday),
    occupancy: call('/api/analytics/occupancy', today),
    previousOccupancy: call('/api/analytics/occupancy', yesterday),
    demographics: call('/api/analytics/demographics', today),
  }
}

export function compareToPrevious(current, previous) {
  if (!previous) {
    return { direction: 'same', percent: 0 }
  }

  const delta = ((current - previous) / previous) * 100
  if (Math.abs(delta) < 0.5) {
    return { direction: 'same', percent: 0 }
  }

  return {
    direction: delta > 0 ? 'more' : 'less',
    percent: Math.round(Math.abs(delta)),
  }
}

export function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

export function formatDwell(minutes) {
  const totalSeconds = Math.round(Number(minutes) * 60)
  const wholeMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(wholeMinutes).padStart(2, '0')}min ${String(seconds).padStart(2, '0')}sec`
}
