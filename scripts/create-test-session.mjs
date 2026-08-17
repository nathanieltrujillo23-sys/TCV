// Creates (or resets) a dedicated test user via the Supabase Admin API, for
// automated verification only — never used for real data. Requires
// SUPABASE_SERVICE_ROLE_KEY, which must stay local-only (see .env.local.example).
//
// Usage: node scripts/create-test-session.mjs
// Prints an email + password you can use with supabase.auth.signInWithPassword()
// from a browser console to establish a real, RLS-scoped test session —
// bypassing the app's email-OTP UI, which needs a real inbox.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    // .env.local not present — rely on already-exported env vars
  }
}

loadEnvLocal();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = "claude-test@tcv-accounting.local";
const password = randomUUID();

const { data: list, error: listError } = await admin.auth.admin.listUsers();
if (listError) throw listError;

let testUser = list.users.find((u) => u.email === TEST_EMAIL);

if (!testUser) {
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  testUser = data.user;
  console.log("Created new test user.");
} else {
  const { error } = await admin.auth.admin.updateUserById(testUser.id, { password });
  if (error) throw error;
  console.log("Reset password for existing test user.");
}

console.log("\n--- Test session credentials ---");
console.log("user id: ", testUser.id);
console.log("email:   ", TEST_EMAIL);
console.log("password:", password);
console.log("---------------------------------");
console.log(
  "\nIn the browser console: await supabase.auth.signInWithPassword({ email: '" +
    TEST_EMAIL +
    "', password: '" +
    password +
    "' })"
);
