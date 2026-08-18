import { useState, type FormEvent } from "react";
import { useAuth } from "../state/AuthContext";

export function SignInPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
        setNotice("Account created — check your email to confirm it, then sign in.");
        setMode("signin");
        setPassword("");
      }
      // If no confirmation is needed, onAuthStateChange picks up the new
      // session automatically and the app switches views on its own.
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-white font-bold text-2xl">TRUCAPITALVENTURES</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your ledger</p>
        </div>

        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          <div className="flex gap-1 mb-4 rounded-lg bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === "signin" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === "signup" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-slate-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-slate-500"
            />
            {mode === "signup" && (
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name (optional)"
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:border-slate-500"
              />
            )}
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold py-2.5 text-sm"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            {error && <p className="text-rose-400 text-xs">{error}</p>}
            {notice && <p className="text-emerald-400 text-xs">{notice}</p>}
          </form>
        </div>

        <p className="text-slate-600 text-xs text-center leading-relaxed">
          Your data lives in your own account and syncs across every device you sign into.
        </p>
      </div>
    </div>
  );
}
