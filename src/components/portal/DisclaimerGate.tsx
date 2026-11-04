import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useProfile } from "../../state/ProfileContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

/** First visit to the portal: the education disclaimer must be accepted once (saved to the profile). */
export function DisclaimerGate({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  return profile?.disclaimerAcceptedAt ? <>{children}</> : <DisclaimerCard />;
}

function DisclaimerCard() {
  const t = useT();
  useDocumentTitle("disclaimer.title");
  const { acceptDisclaimer } = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    const { error } = await acceptDisclaimer();
    setBusy(false);
    if (error) setError(t("disclaimer.error", { error }));
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-16">
      <div className="bg-paper border border-line border-t-2 border-t-ink p-6 flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">{t("disclaimer.title")}</p>
        <p className="text-ink leading-relaxed">{t("disclaimer.body1")}</p>
        <p className="text-ink-soft leading-relaxed">{t("disclaimer.body2")}</p>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button type="button" onClick={accept} disabled={busy} className="bg-accent hover:bg-accent-dark disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5">
            {t("disclaimer.accept")}
          </button>
          <Link to="/disclosures" className="text-sm text-accent underline underline-offset-4 hover:text-accent-dark">
            {t("disclaimer.read")}
          </Link>
        </div>
      </div>
    </div>
  );
}
