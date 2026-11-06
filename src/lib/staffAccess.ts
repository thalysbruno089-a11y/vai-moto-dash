// Pedro and Gabriel (secretaries) may only add motoboys; the database mirrors this.
const RESTRICTED_STAFF_IDS = [
  '10902345-eb9b-4f1c-965b-0c121503fa08', // Pedro
  '9ac4e986-ff35-49af-a377-4dd9e281af4a', // Gabriel
];

export function isAddOnlyStaff(userId: string | undefined): boolean {
  return Boolean(userId && RESTRICTED_STAFF_IDS.includes(userId));
}
