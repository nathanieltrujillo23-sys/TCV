import { useEffect, useMemo, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { createSupabasePortalRepository, type ClientProgressRow } from "../../data/portalRepository";
import { LESSONS } from "../../content/lessons";
import { ErrorText, Panel } from "./AppUI";

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Owner-only overview of how far each client has gotten in the course. */
export function ClientProgressTable() {
  const t = useT();
  const repo = useMemo(() => createSupabasePortalRepository(), []);
  const [rows, setRows] = useState<ClientProgressRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    repo
      .clientProgress()
      .then((r) => !cancelled && setRows(r))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [repo]);

  return (
    <Panel title={t("dash.clients.title")}>
      {error ? (
        <ErrorText>{t("dash.clients.error", { error })}</ErrorText>
      ) : rows === null ? (
        <p className="text-sm text-slate-400">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400">{t("dash.clients.empty")}</p>
      ) : (
        <div className="overflow-x-auto -m-4">
          <table className="w-full text-sm">
            <thead className="text-[11px] font-mono uppercase tracking-[0.1em] text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t("dash.clients.email")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("dash.clients.type")}</th>
                <th className="px-4 py-2 text-right font-medium">{t("dash.clients.modules")}</th>
                <th className="px-4 py-2 text-right font-medium">{t("dash.clients.score")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("dash.clients.last")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("dash.clients.joined")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td className="px-4 py-2 text-white break-all">{r.email}</td>
                  <td className="px-4 py-2 text-slate-300">
                    {r.accountType === "business" ? t("dash.clients.typeBusiness") : r.accountType === "person" ? t("dash.clients.typePerson") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-slate-200">
                    {r.lessonsCompleted}/{LESSONS.length}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-slate-200">{r.averageScore === null ? "—" : `${r.averageScore}%`}</td>
                  <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{r.lastActivity ? dateFmt.format(new Date(r.lastActivity)) : "—"}</td>
                  <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{dateFmt.format(new Date(r.joinedAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
