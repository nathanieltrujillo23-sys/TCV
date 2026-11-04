import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// The two accounts the signed in tests use. Both are test accounts on a domain
// that cannot receive mail; no real account is ever touched.
export const STAFF_EMAIL = "claude-test@tcv-accounting.local";
export const CLIENT_EMAIL = "claude-person@tcv-accounting.local";

/** Marks every trade the tests create, so cleanup can find them. */
export const E2E_NOTE = "e2e-smoke";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    // .env.local not present (CI): signed in tests are skipped
  }
}

/** A service role client, or null when the key is not available. */
export function adminClient(): SupabaseClient | null {
  if (process.env.CI) return null;
  loadEnvLocal();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function userId(admin: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`Test account ${email} does not exist. Run npm run check:rls once to create it.`);
  return user.id;
}

/** Removes everything the tests leave behind on the test accounts. */
export async function cleanUp(admin: SupabaseClient) {
  const staff = await userId(admin, STAFF_EMAIL);
  const client = await userId(admin, CLIENT_EMAIL);
  await admin.from("trades").delete().eq("user_id", staff).eq("notes", E2E_NOTE);
  await admin.from("lesson_progress").delete().eq("user_id", client);
  await admin.from("profiles").update({ disclaimer_accepted_at: null }).eq("id", client);
}
