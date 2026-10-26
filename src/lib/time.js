function offsetMs(timeZone, utcMs) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const value = (type) => Number(parts.find((part) => part.type === type).value)
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  )
  return asUtc - utcMs
}

function calendarParts(timeZone, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type) => Number(parts.find((part) => part.type === type).value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

function zonedMidnightUtc(zone, year, month, day) {
  const guess = Date.UTC(year, month - 1, day)
  const first = guess - offsetMs(zone, guess)
  return guess - offsetMs(zone, first) // second pass, offset can shift around DST
}

function dayRange(timeZone, year, month, day) {
  const fromUtc = zonedMidnightUtc(timeZone, year, month, day)
  const next = new Date(fromUtc + 36 * 60 * 60 * 1000)
  const nextParts = calendarParts(timeZone, next)
  const nextStart = zonedMidnightUtc(timeZone, nextParts.year, nextParts.month, nextParts.day)
  return { fromUtc, toUtc: nextStart - 1 }
}

export function siteCalendarDate(timeZone, date = new Date()) {
  const { year, month, day } = calendarParts(timeZone || 'UTC', date)
  const pad = (value) => String(value).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

export function rangeForCalendarDate(timeZone, dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || '')
  if (!match) return siteDayRange(timeZone)
  return dayRange(timeZone, Number(match[1]), Number(match[2]), Number(match[3]))
}

export function siteDayRange(timeZone, date = new Date()) {
  const { year, month, day } = calendarParts(timeZone, date)
  return dayRange(timeZone, year, month, day)
}

export function previousSiteDayRange(timeZone, date = new Date()) {
  const { fromUtc } = siteDayRange(timeZone, date)
  return siteDayRange(timeZone, new Date(fromUtc - 1))
}
