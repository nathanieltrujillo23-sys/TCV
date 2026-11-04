import { Link } from "react-router-dom";
import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Container, PageHeader } from "../../components/site/SiteUI";

export function NotFoundPage() {
  const t = useT();
  useDocumentTitle("page.notFound.title");
  return (
    <Container narrow>
      <PageHeader titleKey="page.notFound.title" leadKey="page.notFound.body" />
      <Link to="/" className="text-accent font-medium underline underline-offset-4 hover:text-accent-dark">
        {t("common.backHome")}
      </Link>
    </Container>
  );
}
