type Shift = 'day' | 'night' | 'weekend' | 'star' | 'free'

const saoPauloTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const weekdays: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function isWithinShift(shift: Shift, now = new Date()): boolean {
  const parts = saoPauloTime.formatToParts(now)
  const weekday = weekdays[parts.find((part) => part.type === 'weekday')?.value ?? '']
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)
  const minutesSinceMidnight = hour * 60 + minute

  switch (shift) {
    case 'day':
      return minutesSinceMidnight >= 7 * 60 && minutesSinceMidnight < 19 * 60
    case 'night':
      return minutesSinceMidnight >= 16 * 60
    case 'weekend':
      return weekday === 5
        ? minutesSinceMidnight >= 16 * 60
        : (weekday === 6 || weekday === 0) && minutesSinceMidnight >= 6 * 60
    case 'star':
      return minutesSinceMidnight >= 6 * 60
    case 'free':
      return (weekday === 0 || weekday === 6)
        ? minutesSinceMidnight >= 6 * 60
        : weekday >= 1 && weekday <= 5 && minutesSinceMidnight >= 16 * 60
  }
  return false
}