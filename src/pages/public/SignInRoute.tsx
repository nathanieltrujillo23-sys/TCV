import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../state/AuthContext";
import { useProfile } from "../../state/ProfileContext";
import { useT } from "../../i18n/LanguageContext";
import { SignInPage } from "../../components/SignInPage";
import { FullScreenMessage } from "../../routes/guards";
import { homePathFor } from "../../routes/homePath";

/** /signin and /signup. Once signed in, goes back to where the visitor was headed, or to their home area. */
export function SignInRoute({ mode }: { mode: "signin" | "signup" }) {
  const t = useT();
  const { user } = useAuth();
  const { loading, isStaff } = useProfile();
  const location = useLocation();

  if (loading) return <FullScreenMessage>{t("common.loading")}</FullScreenMessage>;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? homePathFor(isStaff)} replace />;
  }
  return <SignInPage key={mode} initialMode={mode} />;
}
