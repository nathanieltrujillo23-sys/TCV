import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useProfile } from "../state/ProfileContext";
import { useT } from "../i18n/LanguageContext";

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

/** Owner or admin only. Everyone else is sent to the client portal. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { isStaff } = useProfile();
  return (
    <RequireAuth>
      {isStaff ? children : <Navigate to="/portal" replace />}
    </RequireAuth>
  );
}

/** Owner only (contact inbox, client progress). Admins go back to /app, clients to /portal. */
export function RequireOwner({ children }: { children: ReactNode }) {
  const { isOwner, isStaff } = useProfile();
  return (
    <RequireAuth>
      {isOwner ? children : <Navigate to={isStaff ? "/app" : "/portal"} replace />}
    </RequireAuth>
  );
}
