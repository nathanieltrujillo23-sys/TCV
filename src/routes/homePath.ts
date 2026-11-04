/** Where a signed in account lands by default. */
export function homePathFor(isStaff: boolean): string {
  return isStaff ? "/app" : "/portal";
}
