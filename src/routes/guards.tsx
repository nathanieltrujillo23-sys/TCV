import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useProfile } from "../state/ProfileContext";
import { useT } from "../i18n/LanguageContext";
import type { Access } from "../lib/access";
import { homePathFor } from "./homePath";

export function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <p className="text-slate-400 text-sm text-center">{children}</p>
    </div>
  );
}

/** Signed in only. Signed out visitors go to /signin and come back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const t = useT();
  const { user } = useAuth();
  const { loading, error } = useProfile();
  const location = useLocation();

  if (loading) return <FullScreenMessage>{t("common.loading")}</FullScreenMessage>;
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  if (error) return <FullScreenMessage>{t("common.profileError", { error })}</FullScreenMessage>;
  return <>{children}</>;
}

/** Signed in AND allowed to use a given tool. Others go to their own home area. */
export function RequireAccess({ need, children }: { need: keyof Access; children: ReactNode }) {
  const { access } = useProfile();
  return <RequireAuth>{access[need] ? children : <Navigate to={homePathFor(access)} replace />}</RequireAuth>;
}
