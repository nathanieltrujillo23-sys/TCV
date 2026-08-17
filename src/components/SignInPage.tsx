import { useState, type FormEvent } from "react";
import { useAuth } from "../state/AuthContext";

export function SignInPage() {
  const { sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    const { error } = await sendCode(email.trim());
    setBusy(false);
    if (error) {
      setError(error);
    } else {
      setStep("code");
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    const { error } = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (error) setError(error);
    // On success, AuthContext's onAuthStateChange updates `user` and the
    // app switches views automatically.
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-white font-bold text-2xl">TRUCAPITALVENTURES</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your ledger</p>
        </div>

        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-3">
              <h2 className="text-slate-200 font-semibold text-sm">Sign in with email</h2>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold py-2.5 text-sm"
              >
                {busy ? "Sending…" : "Send code"}
              </button>
              {error && <p className="text-rose-400 text-xs">{error}</p>}
            </form>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <h2 className="text-slate-200 font-semibold text-sm">Enter your code</h2>
              <p className="text-slate-500 text-xs">
                We sent a 6-digit code to <span className="text-slate-300">{email}</span>.
              </p>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-lg tracking-widest text-center focus:outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold py-2.5 text-sm"
              >
                {busy ? "Verifying…" : "Verify & sign in"}
              </button>
              {error && <p className="text-rose-400 text-xs">{error}</p>}
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center leading-relaxed">
          Your data lives in your own account and syncs across every device you sign into.
        </p>
      </div>
    </div>
  );
}
