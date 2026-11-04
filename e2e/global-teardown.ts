import { adminClient, cleanUp } from "./testAccounts";

export default async function globalTeardown() {
  const admin = adminClient();
  if (admin) await cleanUp(admin);
}
