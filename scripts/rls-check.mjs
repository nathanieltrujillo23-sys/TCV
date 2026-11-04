// Row level security check. Signs in as test accounts (never a real one) and
// confirms that private tables stay private:
//   1. A regular client (no ledger, no journal) sees zero rows in every owner
//      table and every insert is refused.
//   2. A signed out visitor sees zero rows and cannot write.
//   3. Clients with the ledger or the journal see only their own rows.
// Prints a pass/fail table and exits with code 1 if anything fails.
//
// Usage: npm run check:rls
// Needs VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
// in .env.local. The service role key is only used to reset the test accounts'
// passwords and to count rows before and after, never to read private data
// into the report.

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
    // .env.local not present: rely on already exported env vars
  }
}

loadEnvLocal();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Only these accounts are ever signed in. The domain cannot receive mail, so
// none of them can belong to a real person.
const TEST_DOMAIN = "@tcv-accounting.local";
const CLIENT = { email: `claude-person${TEST_DOMAIN}`, meta: { account_type: "person", employment: "student" } };
const TRADER = { email: `claude-trader${TEST_DOMAIN}`, meta: { account_type: "person", employment: "trader" } };
const BUSINESS = { email: `claude-business${TEST_DOMAIN}`, meta: { account_type: "business", business_trades: false } };

const OWNER_TABLES = [
  "transactions",
  "presets",
  "managed_list_items",
  "audit_log",
  "contact_messages",
  "trading_accounts",
  "trades",
  "trade_screenshots",
  "trade_reviews",
  "journal_days",
  "journal_settings",
  "journal_rules",
];

// A valid row for each table, so the only reason an insert can fail is the
// security policy. contact_messages is left out on purpose: the public
// contact form lets anyone send a message.
function sampleRow(table, uid) {
  const now = new Date().toISOString();
  switch (table) {
    case "transactions":
      return { id: randomUUID(), user_id: uid, type: "expense", date: now, amount: 1, purchases: 1, item: "rls-check" };
    case "presets":
      return { id: randomUUID(), user_id: uid, type: "expense", label: "rls-check" };
    case "managed_list_items":
      return { id: randomUUID(), user_id: uid, category: "vendor", name: `rls-check-${randomUUID()}` };
    case "audit_log":
      return { id: randomUUID(), user_id: uid, transaction_id: randomUUID(), action: "create" };
    case "trading_accounts":
      return { id: randomUUID(), user_id: uid, label: "rls-check" };
    case "trades":
      return { id: randomUUID(), user_id: uid, instrument: "ES", direction: "long", entry_time: now, entry_price: 5000, contracts: 1 };
    case "trade_screenshots":
      return { id: randomUUID(), user_id: uid, trade_id: randomUUID(), kind: "entry", path: `${uid}/rls-check.jpg` };
    case "trade_reviews":
      return { id: randomUUID(), user_id: uid, trade_id: randomUUID(), result: { check: true } };
    case "journal_days":
      return { id: randomUUID(), user_id: uid, day: "2026-01-02", bias: "rls-check" };
    case "journal_settings":
      return { user_id: uid };
    case "journal_rules":
      return { id: randomUUID(), user_id: uid, label: "rls-check" };
    default:
      return null;
  }
}

const rows = [];
function check(name, ok, detail = "") {
  rows.push({ check: name, result: ok ? "PASS" : "FAIL", detail: String(detail ?? "").slice(0, 60) });
}

async function countAll() {
  const counts = {};
  for (const table of OWNER_TABLES) {
    const { data, error } = await admin.from(table).select("id:" + (table === "journal_settings" ? "user_id" : "id"));
    counts[table] = error ? `error: ${error.message}` : data.length;
  }
  return counts;
}

async function signIn(account) {
  if (!account.email.endsWith(TEST_DOMAIN)) throw new Error(`Refusing to sign in as ${account.email}`);
  const password = randomUUID();
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email === account.email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password });
    if (error) throw error;
  } else {
    const { error } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: account.meta,
    });
    if (error) throw error;
  }
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: account.email, password });
  if (error) throw new Error(`${account.email}: ${error.message}`);
  return { client, uid: data.user.id, name: account.email.replace(TEST_DOMAIN, "") };
}

// "Refused" means Postgres said no for permission reasons (code 42501), not
// that the row was malformed.
function refused(error) {
  return !!error && (error.code === "42501" || /row-level security|permission denied/i.test(error.message));
}

async function removeIfInserted(table, row) {
  const key = table === "journal_settings" ? "user_id" : "id";
  await admin.from(table).delete().eq(key, row[key]);
}

const before = await countAll();

// 1. Regular client: zero rows and no writes in every owner table.
const client = await signIn(CLIENT);
for (const table of OWNER_TABLES) {
  const { data, error } = await client.client.from(table).select("*");
  check(`client reads ${table}`, refused(error) || (data ?? []).length === 0, error ? error.message : `${data.length} rows`);

  const row = sampleRow(table, client.uid);
  if (!row) continue;
  const ins = await client.client.from(table).insert(row);
  if (!ins.error) await removeIfInserted(table, row);
  check(`client inserts into ${table}`, refused(ins.error), ins.error ? ins.error.message : "INSERTED");
}

{
  const { data, error } = await client.client.rpc("client_progress");
  check("client calls client_progress()", refused(error) || (data ?? []).length === 0, error ? error.message : `${data.length} rows`);
  const { data: profiles } = await client.client.from("profiles").select("id");
  check("client sees only its own profile", (profiles ?? []).every((p) => p.id === client.uid), `${profiles?.length} rows`);
  const { data: progress } = await client.client.from("lesson_progress").select("user_id");
  check("client sees only its own lesson progress", (progress ?? []).every((p) => p.user_id === client.uid), `${progress?.length} rows`);
  const up = await client.client.from("profiles").update({ role: "owner" }).eq("id", client.uid);
  const { data: me } = await admin.from("profiles").select("role").eq("id", client.uid).single();
  check("client cannot make itself owner", me?.role === "client", up.error ? up.error.message : "update accepted, role unchanged");
  for (const bucket of ["receipts", "trade-screenshots"]) {
    const upload = await client.client.storage.from(bucket).upload(`${client.uid}/rls-check.txt`, new Blob(["x"]), { upsert: true });
    if (!upload.error) await admin.storage.from(bucket).remove([`${client.uid}/rls-check.txt`]);
    check(`client uploads to ${bucket}`, !!upload.error, upload.error ? upload.error.message : "UPLOADED");
  }
}

// 2. Signed out visitor.
const visitor = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
for (const table of [...OWNER_TABLES, "profiles", "lesson_progress"]) {
  const { data, error } = await visitor.from(table).select("*");
  check(`visitor reads ${table}`, refused(error) || (data ?? []).length === 0, error ? error.message : `${data.length} rows`);
}
{
  const row = sampleRow("transactions", randomUUID());
  const ins = await visitor.from("transactions").insert(row);
  if (!ins.error) await removeIfInserted("transactions", row);
  check("visitor inserts into transactions", !!ins.error, ins.error ? ins.error.message : "INSERTED");
  const { data, error } = await visitor.rpc("client_progress");
  check("visitor calls client_progress()", !!error || (data ?? []).length === 0, error ? error.message : `${data.length} rows`);
}

// 3. Clients with tools see only their own rows.
for (const account of [TRADER, BUSINESS]) {
  const s = await signIn(account);
  for (const table of OWNER_TABLES) {
    if (table === "contact_messages") continue;
    const { data, error } = await s.client.from(table).select("user_id");
    const others = (data ?? []).filter((r) => r.user_id !== s.uid).length;
    check(`${s.name} sees only its own ${table}`, others === 0, error ? error.message : `${data.length} own, ${others} others`);
  }
}

// 4. Planning workbooks: each account sees and changes only its own.
{
  const owner = await signIn(CLIENT);
  const other = await signIn(TRADER);
  const mine = { version: 1, note: "rls-check" };
  const ins = await owner.client.from("planning_workbooks").upsert({ data: mine }, { onConflict: "user_id" });
  check("client saves its own workbook", !ins.error, ins.error?.message ?? "saved");

  const { data: seen } = await other.client.from("planning_workbooks").select("user_id");
  check("another client cannot see it", (seen ?? []).every((r) => r.user_id === other.uid), `${seen?.length} rows`);
  const forged = await other.client.from("planning_workbooks").insert({ user_id: owner.uid, data: { forged: true } });
  check("another client cannot write it", refused(forged.error), forged.error ? forged.error.message : "INSERTED");
  await other.client.from("planning_workbooks").update({ data: { overwritten: true } }).eq("user_id", owner.uid);
  const { data: still } = await admin.from("planning_workbooks").select("data").eq("user_id", owner.uid).single();
  check("another client cannot overwrite it", still?.data?.note === "rls-check", JSON.stringify(still?.data));

  const { data: anon, error: anonError } = await visitor.from("planning_workbooks").select("*");
  check("visitor reads planning_workbooks", refused(anonError) || (anon ?? []).length === 0, anonError ? anonError.message : `${anon.length} rows`);
  const bad = await owner.client.from("planning_workbooks").upsert({ data: [1, 2] }, { onConflict: "user_id" });
  check("workbook must be an object", !!bad.error, bad.error ? bad.error.message : "SAVED");

  await admin.from("planning_workbooks").delete().in("user_id", [owner.uid, other.uid]);
}

const after = await countAll();
check("no rows changed in any owner table", JSON.stringify(before) === JSON.stringify(after), JSON.stringify(after));

console.table(rows);
const failed = rows.filter((r) => r.result === "FAIL").length;
console.log(failed === 0 ? `ALL ${rows.length} CHECKS PASS` : `${failed} OF ${rows.length} CHECKS FAILED`);
process.exit(failed === 0 ? 0 : 1);
