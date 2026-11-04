import type { Access } from "../lib/access";

/** Where a signed in account lands by default: the workspace if it has any tools there, otherwise the portal. */
export function homePathFor(access: Access): string {
  return access.workspace ? "/app" : "/portal";
}
