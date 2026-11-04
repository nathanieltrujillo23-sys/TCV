import { useMemo, useState, type FormEvent } from "react";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Container, PageHeader } from "../../components/site/SiteUI";
import { createSupabaseContactRepository } from "../../data/contactRepository";
import { CONTACT_MAX_MESSAGE, secondsUntilAllowed, validateContact } from "../../lib/contactForm";

const TOPICS = [
  "contact.topic.general",
  "contact.topic.courses",
  "contact.topic.tools",
  "contact.topic.partnerships",
  "contact.topic.other",
] as const;

const LAST_SENT_KEY = "tcv:contact:lastSentAt";

function readLastSent(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_SENT_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeLastSent(time: number) {
  try {
    localStorage.setItem(LAST_SENT_KEY, String(time));
  } catch {
    /* the cooldown just won't survive a reload */
  }
}

const inputClass =
  "w-full bg-card border border-line px-3 py-2.5 text-ink text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function ContactPage() {
  const t = useT();
  useDocumentTitle("site.nav.contact");
  const repository = useMemo(() => createSupabaseContactRepository(), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function fail(key: StringKey, vars?: Record<string, string | number>) {
    setError(t(key, vars));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const problem = validateContact({ name, email, message });
    if (problem) return fail(problem);

    const wait = secondsUntilAllowed(readLastSent(), Date.now());
    if (wait > 0) return fail("contact.error.wait", { seconds: wait });

    // Bots tend to fill every field. Pretend it worked and send nothing.
    if (website.trim()) {
      setSentTo(email.trim());
      return;
    }

    setSending(true);
    try {
      await repository.send({ name, email, topic: t(topic), message });
      writeLastSent(Date.now());
      setSentTo(email.trim());
      setName("");
      setEmail("");
      setMessage("");
      setTopic(TOPICS[0]);
    } catch {
      fail("contact.error.generic");
    } finally {
      setSending(false);
    }
  }

  return (
    <Container narrow>
      <PageHeader titleKey="contact.title" leadKey="contact.lead" />

      {sentTo ? (
        <div className="bg-card border border-line border-l-4 border-l-accent p-6" role="status">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{t("contact.success.title")}</h2>
          <p className="mt-2 text-ink-soft">{t("contact.success.body", { email: sentTo })}</p>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="mt-5 text-accent font-medium underline underline-offset-4 hover:text-accent-dark"
          >
            {t("contact.success.again")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {t("contact.name")}
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={200} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {t("contact.email")}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={320} className={inputClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            {t("contact.topic")}
            <select value={topic} onChange={(e) => setTopic(e.target.value as (typeof TOPICS)[number])} className={inputClass}>
              {TOPICS.map((key) => (
                <option key={key} value={key}>
                  {t(key)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            {t("contact.message")}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={CONTACT_MAX_MESSAGE} className={inputClass} />
          </label>
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label>
              {t("contact.honeypot")}
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
            </label>
          </div>
          <p className="text-sm text-ink-soft">{t("contact.privacyHint")}</p>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="self-start bg-accent text-white px-6 py-2.5 text-sm font-medium hover:bg-accent-dark disabled:opacity-60"
          >
            {t(sending ? "contact.sending" : "contact.submit")}
          </button>
        </form>
      )}
    </Container>
  );
}
