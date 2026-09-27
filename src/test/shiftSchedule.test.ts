import { describe, expect, it } from 'vitest'
import { isWithinShift } from '../../supabase/functions/_shared/shiftSchedule'

describe('queue shift schedule in Sao Paulo time', () => {
  it('allows diurno from 06:00 through 18:59 and rejects the boundaries', () => {
    expect(isWithinShift('day', new Date('2026-09-28T08:59:00Z'))).toBe(false)
    expect(isWithinShift('day', new Date('2026-09-28T09:00:00Z'))).toBe(true)
    expect(isWithinShift('day', new Date('2026-09-28T22:00:00Z'))).toBe(false)
  })

  it('allows noturno from 16:00 until midnight', () => {
    expect(isWithinShift('night', new Date('2026-09-28T18:59:00Z'))).toBe(false)
    expect(isWithinShift('night', new Date('2026-09-28T19:00:00Z'))).toBe(true)
    expect(isWithinShift('night', new Date('2026-09-29T03:00:00Z'))).toBe(false)
  })

  it('allows final de semana from Friday at 16:00 until Sunday at 23:00', () => {
    expect(isWithinShift('weekend', new Date('2026-10-02T18:59:00Z'))).toBe(false)
    expect(isWithinShift('weekend', new Date('2026-10-02T19:00:00Z'))).toBe(true)
    expect(isWithinShift('weekend', new Date('2026-10-04T22:59:00Z'))).toBe(true)
    expect(isWithinShift('weekend', new Date('2026-10-05T02:00:00Z'))).toBe(false)
  })

  it('allows estrelinha daily from 06:00 until midnight', () => {
    expect(isWithinShift('star', new Date('2026-09-28T08:59:00Z'))).toBe(false)
    expect(isWithinShift('star', new Date('2026-09-28T09:00:00Z'))).toBe(true)
    expect(isWithinShift('star', new Date('2026-09-29T03:00:00Z'))).toBe(false)
  })

  it('allows free all weekend and weekdays from 16:00 until midnight', () => {
    expect(isWithinShift('free', new Date('2026-09-28T18:59:00Z'))).toBe(false)
    expect(isWithinShift('free', new Date('2026-09-28T19:00:00Z'))).toBe(true)
    expect(isWithinShift('free', new Date('2026-10-03T08:00:00Z'))).toBe(true)
  })
})