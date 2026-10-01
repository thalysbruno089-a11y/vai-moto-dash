import { describe, expect, it } from 'vitest'
import { isWithinShift } from '../../supabase/functions/_shared/shiftSchedule'

describe('queue shift schedule in Sao Paulo time', () => {
  it('allows diurno daily from 07:00 through 18:59', () => {
    expect(isWithinShift('day', new Date('2026-09-28T09:59:00Z'))).toBe(false)
    expect(isWithinShift('day', new Date('2026-09-28T10:00:00Z'))).toBe(true)
    expect(isWithinShift('day', new Date('2026-09-28T21:59:00Z'))).toBe(true)
    expect(isWithinShift('day', new Date('2026-09-28T22:00:00Z'))).toBe(false)
  })

  it('allows noturno from 16:00 until midnight', () => {
    expect(isWithinShift('night', new Date('2026-09-28T18:59:00Z'))).toBe(false)
    expect(isWithinShift('night', new Date('2026-09-28T19:00:00Z'))).toBe(true)
    expect(isWithinShift('night', new Date('2026-09-29T03:00:00Z'))).toBe(false)
  })

  it('allows final de semana Friday 16:00-23:59 and Saturday/Sunday 06:00-23:59', () => {
    expect(isWithinShift('weekend', new Date('2026-10-02T18:59:00Z'))).toBe(false)
    expect(isWithinShift('weekend', new Date('2026-10-02T19:00:00Z'))).toBe(true)
    expect(isWithinShift('weekend', new Date('2026-10-03T02:59:00Z'))).toBe(true)
    expect(isWithinShift('weekend', new Date('2026-10-03T03:00:00Z'))).toBe(false)
    expect(isWithinShift('weekend', new Date('2026-10-03T08:59:00Z'))).toBe(false)
    expect(isWithinShift('weekend', new Date('2026-10-03T09:00:00Z'))).toBe(true)
    expect(isWithinShift('weekend', new Date('2026-10-04T08:59:00Z'))).toBe(false)
    expect(isWithinShift('weekend', new Date('2026-10-04T09:00:00Z'))).toBe(true)
    expect(isWithinShift('weekend', new Date('2026-10-05T02:59:00Z'))).toBe(true)
    expect(isWithinShift('weekend', new Date('2026-10-05T03:00:00Z'))).toBe(false)
  })

  it('allows estrelinha daily from 06:00 until midnight', () => {
    expect(isWithinShift('star', new Date('2026-09-28T08:59:00Z'))).toBe(false)
    expect(isWithinShift('star', new Date('2026-09-28T09:00:00Z'))).toBe(true)
    expect(isWithinShift('star', new Date('2026-09-29T02:59:00Z'))).toBe(true)
    expect(isWithinShift('star', new Date('2026-09-29T03:00:00Z'))).toBe(false)
  })

  it('allows free weekdays 16:00-23:59 and weekends 06:00-23:59', () => {
    expect(isWithinShift('free', new Date('2026-09-28T18:59:00Z'))).toBe(false)
    expect(isWithinShift('free', new Date('2026-09-28T19:00:00Z'))).toBe(true)
    expect(isWithinShift('free', new Date('2026-10-03T08:59:00Z'))).toBe(false)
    expect(isWithinShift('free', new Date('2026-10-03T09:00:00Z'))).toBe(true)
    expect(isWithinShift('free', new Date('2026-10-04T08:59:00Z'))).toBe(false)
    expect(isWithinShift('free', new Date('2026-10-04T09:00:00Z'))).toBe(true)
    expect(isWithinShift('free', new Date('2026-10-05T03:00:00Z'))).toBe(false)
  })
})