// Queue access is also enforced by database policies and queue actions.
const GABRIEL_USER_ID = '9ac4e986-ff35-49af-a377-4dd9e281af4a';
const PEDRO_USER_ID = '10902345-eb9b-4f1c-965b-0c121503fa08';

export function canFullyManageQueue(profile: { role: string; name: string } | null, userId: string | undefined): boolean {
  return Boolean(profile && (profile.role === 'admin' || profile.name.toLowerCase() === 'sofia' || userId === PEDRO_USER_ID));
}

export function canManageQueue(profile: { role: string; name: string } | null, userId: string | undefined): boolean {
  return canFullyManageQueue(profile, userId) || Boolean(profile && userId === GABRIEL_USER_ID);
}

export function canModifyQueueEntries(profile: { role: string; name: string } | null, userId: string | undefined): boolean {
  return canManageQueue(profile, userId);
}