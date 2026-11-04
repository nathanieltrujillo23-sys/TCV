import { useEffect, useMemo, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import type { StringKey } from "../../i18n/en";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { createSupabaseContactRepository, type ContactMessage, type ContactStatus } from "../../data/contactRepository";

const FILTERS: { status: ContactStatus; labelKey: StringKey; emptyKey: StringKey }[] = [
  { status: "new", labelKey: "app.messages.filter.new", emptyKey: "app.messages.empty.new" },
  { status: "read", labelKey: "app.messages.filter.read", emptyKey: "app.messages.empty.read" },
  { status: "archived", labelKey: "app.messages.filter.archived", emptyKey: "app.messages.empty.archived" },
];

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function MessagesPage() {
  const t = useT();
  useDocumentTitle("app.messages.title");
  const repository = useMemo(() => createSupabaseContactRepository(), []);

  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContactStatus>("new");

  useEffect(() => {
    let cancelled = false;
    repository
      .list()
      .then((rows) => !cancelled && setMessages(rows))
      .catch((err: Error) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [repository]);

  async function move(id: string, status: ContactStatus) {
    setUpdateError(null);
    const previous = messages;
    setMessages((rows) => rows?.map((m) => (m.id === id ? { ...m, status } : m)) ?? rows);
    try {
      await repository.setStatus(id, status);
    } catch (err) {
      setMessages(previous);
      setUpdateError(t("app.messages.updateError", { error: (err as Error).message }));
    }
  }

  const counts = useMemo(() => {
    const c: Record<ContactStatus, number> = { new: 0, read: 0, archived: 0 };
    for (const m of messages ?? []) c[m.status] += 1;
    return c;
  }, [messages]);

  const visible = (messages ?? []).filter((m) => m.status === filter);
  const active = FILTERS.find((f) => f.status === filter)!;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("app.messages.title")}</h1>
        <p className="text-slate-400 text-sm mt-1">{t("app.messages.lead")}</p>
      </div>

      <div className="inline-flex self-start rounded-lg bg-slate-800 p-1 gap-1" role="tablist" aria-label={t("app.messages.filterLabel")}>
        {FILTERS.map((f) => (
          <button
            key={f.status}
            type="button"
            role="tab"
            aria-selected={filter === f.status}
            onClick={() => setFilter(f.status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === f.status ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            {t(f.labelKey)} {counts[f.status] > 0 && <span className="opacity-70">({counts[f.status]})</span>}
          </button>
        ))}
      </div>

      {updateError && <p className="text-rose-400 text-sm" role="alert">{updateError}</p>}

      {loadError ? (
        <p className="text-rose-400 text-sm" role="alert">{t("app.messages.loadError", { error: loadError })}</p>
      ) : messages === null ? (
        <p className="text-slate-400 text-sm">{t("common.loading")}</p>
      ) : visible.length === 0 ? (
        <p className="text-slate-400 text-sm rounded-xl border border-dashed border-slate-700 p-6 text-center">{t(active.emptyKey)}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((m) => (
            <li key={m.id} className="rounded-xl bg-slate-800 border border-slate-700 p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-white font-medium">{m.name}</p>
                <a href={`mailto:${m.email}`} className="text-sm text-emerald-400 hover:text-emerald-300 break-all">{m.email}</a>
                <p className="text-xs text-slate-500 sm:ml-auto">{t("app.messages.received", { date: dateFormat.format(new Date(m.createdAt)) })}</p>
              </div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{m.topic ?? t("app.messages.noTopic")}</p>
              <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{m.message}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`mailto:${m.email}`}
                  className="rounded-md bg-slate-100 text-slate-900 text-xs font-medium px-3 py-1.5 hover:bg-white"
                >
                  {t("app.messages.reply")}
                </a>
                {m.status === "new" && (
                  <button type="button" onClick={() => move(m.id, "read")} className="rounded-md border border-slate-600 text-slate-200 text-xs font-medium px-3 py-1.5 hover:bg-slate-700">
                    {t("app.messages.markRead")}
                  </button>
                )}
                {m.status !== "archived" ? (
                  <button type="button" onClick={() => move(m.id, "archived")} className="rounded-md border border-slate-600 text-slate-200 text-xs font-medium px-3 py-1.5 hover:bg-slate-700">
                    {t("app.messages.archive")}
                  </button>
                ) : (
                  <button type="button" onClick={() => move(m.id, "read")} className="rounded-md border border-slate-600 text-slate-200 text-xs font-medium px-3 py-1.5 hover:bg-slate-700">
                    {t("app.messages.restore")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
