import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";

/** Short education disclaimer shown on every lesson and tool. The full text is on /disclosures. */
export function EducationNote() {
  const t = useT();
  return (
    <p className="border-l-2 border-ink/30 pl-3 text-xs text-ink-soft">
      {t("edu.note")}{" "}
      <Link to="/disclosures" className="underline underline-offset-2 hover:text-ink">
        {t("edu.disclosures")}
      </Link>
    </p>
  );
}
