// Queue access is also enforced by database policies and queue actions.
const GABRIEL_USER_ID = '9ac4e986-ff35-49af-a377-4dd9e281af4a';

export function canManageQueue(profile: { role: string; name: string } | null, userId: string | undefined): boolean {
  return Boolean(profile && (profile.role === 'admin' || profile.name.toLowerCase() === 'sofia' || userId === GABRIEL_USER_ID));
}