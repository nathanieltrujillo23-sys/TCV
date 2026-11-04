/** Looks up a string and fills {name} placeholders. Falls back to the key so a missing string is visible, never blank. */
export function translate(
  dictionary: Record<string, string>,
  key: string,
  vars?: Record<string, string | number>
): string {
  let out = dictionary[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}
