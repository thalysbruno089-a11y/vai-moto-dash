import { describe, expect, it } from 'vitest';
import { canFullyManageQueue, canManageQueue } from '../lib/queueAccess';
import { isAddOnlyStaff } from '../lib/staffAccess';

describe('queue staff permissions', () => {
  it('gives Pedro full queue access without changing his motoboy restrictions', () => {
    const id = '10902345-eb9b-4f1c-965b-0c121503fa08';
    const profile = { name: 'Pedro', role: 'finance' };
    expect(canManageQueue(profile, id)).toBe(true);
    expect(canFullyManageQueue(profile, id)).toBe(true);
    expect(isAddOnlyStaff(id)).toBe(true);
  });

  it('keeps Gabriel limited and unrelated employees outside the queue', () => {
    const id = '9ac4e986-ff35-49af-a377-4dd9e281af4a';
    expect(canManageQueue({ name: 'Gabriel', role: 'finance' }, id)).toBe(true);
    expect(canFullyManageQueue({ name: 'Gabriel', role: 'finance' }, id)).toBe(false);
    expect(canManageQueue({ name: 'Pedro', role: 'finance' }, 'another-id')).toBe(false);
    expect(canManageQueue(null, id)).toBe(false);
  });
});