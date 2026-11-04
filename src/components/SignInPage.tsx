import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useT } from "../i18n/LanguageContext";
import { BrandMark } from "./site/SiteUI";

export function SignInPage({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const t = useT();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError("");
    setNotice("");

    if (mode === "signin") {
      const { error } = await signIn(email.trim(), password);
      setBusy(false);
      if (error) setError(error);
    } else {
      const { error, needsConfirmation } = await signUp(email.trim(), password, businessName);
      setBusy(false);
      if (error) {
        setError(error);
      } else if (needsConfirmation) {
        setNotice(t("auth.confirmEmail"));
        setMode("signin");
        setPassword("");
      }
      // If no confirmation is needed, onAuthStateChange picks up the new
      // session automatically and the app switches views on its own.
    }
  }

  const input =
    "w-full bg-paper border border-line px-3 py-2.5 text-ink text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";
  const tab = (active: boolean) =>
    `flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active ? "border-accent text-ink" : "border-transparent text-ink-soft hover:text-ink"
    }`;

  return (
    <div className="min-h-screen bg-surface text-ink font-sans [color-scheme:light] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Link to="/">
            <BrandMark />
          </Link>
          <p className="text-ink-soft text-sm">{t("auth.subtitle")}</p>
        </div>

        <div className="bg-paper border border-line border-t-2 border-t-ink">
          <div className="flex border-b border-line px-4">
            <button type="button" onClick={() => switchMode("signin")} className={tab(mode === "signin")}>
              {t("auth.tab.signIn")}
            </button>
            <button type="button" onClick={() => switchMode("signup")} className={tab(mode === "signup")}>
              {t("auth.tab.signUp")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("auth.email")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                required
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("auth.password")}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                className={input}
              />
            </label>
            {mode === "signup" && (
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("auth.businessName")}
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={input} />
              </label>
            )}
            <button
              type="submit"
              disabled={busy}
              className="bg-accent hover:bg-accent-dark disabled:opacity-60 text-white font-medium py-2.5 text-sm"
            >
              {busy ? t("auth.working") : t(mode === "signin" ? "auth.submit.signIn" : "auth.submit.signUp")}
            </button>
            {error && (
              <p className="text-red-700 text-sm" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-accent text-sm" role="status">
                {notice}
              </p>
            )}
          </form>
        </div>

        <p className="text-ink-soft text-xs text-center leading-relaxed">{t("auth.footer")}</p>
        <Link to="/" className="text-center text-sm text-accent hover:text-accent-dark underline underline-offset-4">
          {t("auth.backHome")}
        </Link>
      </div>
    </div>
  );
}
