import { useState, type FormEvent } from "react";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useAuth } from "../../state/AuthContext";
import { useProfile } from "../../state/ProfileContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AccountDetailsFields } from "../../components/AccountDetailsFields";
import { accountDetailsError, type AccountDetailsValue } from "../../lib/accountDetails";

export function PortalAccount() {
  const t = useT();
  useDocumentTitle("portal.account.title");
  const { user } = useAuth();
  const { profile, access, updateAnswers } = useProfile();

  const [details, setDetails] = useState<AccountDetailsValue>({
    accountType: profile?.accountType ?? null,
    employment: profile?.employment ?? null,
    businessTrades: profile?.businessTrades ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const problem = accountDetailsError(details);
    if (problem) return setMessage({ tone: "error", text: t(problem) });
    setBusy(true);
    const { error } = await updateAnswers({
      accountType: details.accountType!,
      employment: details.employment,
      businessTrades: details.businessTrades,
    });
    setBusy(false);
    setMessage(error ? { tone: "error", text: t("account.edit.error", { error }) } : { tone: "ok", text: t("account.edit.saved") });
  }

  const tools: StringKey[] = ["account.tools.portal"];
  if (access.ledger) tools.push("account.tools.ledger");
  if (access.journal) tools.push("account.tools.journal");

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("portal.account.title")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t("portal.account.email", { email: user?.email ?? "" })}</p>
      </div>

      <section className="bg-paper border border-line border-t-2 border-t-ink p-5">
        <h2 className="text-sm font-semibold">{t("account.tools.title")}</h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink-soft">
          {tools.map((key) => (
            <li key={key} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={handleSubmit} className="bg-paper border border-line p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">{t("account.edit.title")}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t("account.edit.help")}</p>
        </div>
        <AccountDetailsFields value={details} onChange={setDetails} typeLabelKey="account.type.labelEdit" />
        {message && (
          <p className={`text-sm ${message.tone === "error" ? "text-red-700" : "text-accent"}`} role={message.tone === "error" ? "alert" : "status"}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="self-start bg-accent hover:bg-accent-dark disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5"
        >
          {t(busy ? "account.edit.saving" : "account.edit.save")}
        </button>
      </form>
    </div>
  );
}
