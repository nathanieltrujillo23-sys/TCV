import { randomUUID } from "crypto";
import { adminClient, cleanUp, userId, STAFF_EMAIL, CLIENT_EMAIL } from "./testAccounts";

/**
 * Gives the two test accounts fresh one-time passwords and resets what the
 * tests change (e2e trades, lesson progress, the portal disclaimer). The
 * passwords are passed to the tests through environment variables and are
 * never written to disk.
 */
export default async function globalSetup() {
  const admin = adminClient();
  if (!admin) return;

  for (const [email, envName] of [
    [STAFF_EMAIL, "E2E_STAFF_PASSWORD"],
    [CLIENT_EMAIL, "E2E_CLIENT_PASSWORD"],
  ] as const) {
    const password = randomUUID();
    const { error } = await admin.auth.admin.updateUserById(await userId(admin, email), { password });
    if (error) throw error;
    process.env[envName] = password;
  }
  await cleanUp(admin);
}
