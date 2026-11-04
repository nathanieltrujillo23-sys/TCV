import { useEffect, useState } from "react";
import { useT } from "../../i18n/LanguageContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useJournalRepository } from "../../hooks/useJournalRepository";
import type { JournalRule, JournalSettings } from "../../lib/journalTypes";
import { ErrorText, Field, JournalTabs, Page, Panel } from "../../components/app/AppUI";
import { buttonPrimary, buttonSecondary, inputClass } from "../../components/app/styles";

const EMPTY_SETTINGS: JournalSettings = {
  windowStart: null,
  windowEnd: null,
  timezone: "America/New_York",
  avoidFridays: false,
  avoidNewsDays: false,
  avoidHolidays: false,
  avoidThanksgivingWeek: false,
  avoidLateDecember: false,
};

const DAY_OPTIONS = [
  { key: "avoidFridays", label: "j.rules.avoidFridays" },
  { key: "avoidNewsDays", label: "j.rules.avoidNews" },
  { key: "avoidHolidays", label: "j.rules.avoidHolidays" },
  { key: "avoidThanksgivingWeek", label: "j.rules.avoidThanksgiving" },
  { key: "avoidLateDecember", label: "j.rules.avoidLateDecember" },
] as const;

export function JournalRulesPage() {
  const t = useT();
  useDocumentTitle("j.rules.title");
  const repo = useJournalRepository();

  const [settings, setSettings] = useState<JournalSettings | null>(null);
  const [rules, setRules] = useState<JournalRule[]>([]);
  const [newRule, setNewRule] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([repo.getSettings(), repo.listRules()])
      .then(([s, r]) => {
        if (cancelled) return;
        setSettings(s ?? EMPTY_SETTINGS);
        setRules(r);
      })
      .catch((err: Error) => !cancelled && setError(t("j.loadError", { error: err.message })));
    return () => {
      cancelled = true;
    };
  }, [repo, t]);

  async function run(action: () => Promise<void>, savedMessage = false) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (savedMessage) setNotice(t("j.saved"));
    } catch (err) {
      setError(t("j.error", { error: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  function saveSettings() {
    if (!settings) return;
    const hasStart = !!settings.windowStart;
    const hasEnd = !!settings.windowEnd;
    if (hasStart !== hasEnd || (hasStart && hasEnd && settings.windowStart! >= settings.windowEnd!)) {
      setError(t("j.rules.windowError"));
      return;
    }
    run(() => repo.saveSettings(settings), true);
  }

  function addRule() {
    const label = newRule.trim();
    if (!label) return;
    run(async () => {
      const position = rules.length ? Math.max(...rules.map((r) => r.position)) + 1 : 1;
      const created = await repo.addRule(label, position);
      setRules((prev) => [...prev, created]);
      setNewRule("");
    });
  }

  function updateRule(rule: JournalRule) {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    run(() => repo.updateRule(rule));
  }

  function move(index: number, delta: -1 | 1) {
    const other = rules[index + delta];
    const current = rules[index];
    if (!other) return;
    const a = { ...current, position: other.position };
    const b = { ...other, position: current.position };
    const next = [...rules];
    next[index] = b;
    next[index + delta] = a;
    setRules(next);
    run(async () => {
      await repo.updateRule(a);
      await repo.updateRule(b);
    });
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    run(() => repo.deleteRule(id));
  }

  return (
    <Page titleKey="j.rules.title" leadKey="j.rules.lead">
      <JournalTabs />
      {error && <ErrorText>{error}</ErrorText>}
      {notice && <p className="text-sm text-emerald-400" role="status">{notice}</p>}
      {!settings ? (
        !error && <p className="text-sm text-slate-400">{t("common.loading")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Panel title={t("j.rules.window")}>
              <p className="text-xs text-slate-500 mb-3">{t("j.rules.windowHelp")}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("j.rules.windowStart")}>
                  <input type="time" value={settings.windowStart ?? ""} onChange={(e) => setSettings({ ...settings, windowStart: e.target.value || null })} className={inputClass} />
                </Field>
                <Field label={t("j.rules.windowEnd")}>
                  <input type="time" value={settings.windowEnd ?? ""} onChange={(e) => setSettings({ ...settings, windowEnd: e.target.value || null })} className={inputClass} />
                </Field>
              </div>
            </Panel>
            <Panel title={t("j.rules.standAside")}>
              <p className="text-xs text-slate-500 mb-3">{t("j.rules.standAsideHelp")}</p>
              <div className="flex flex-col gap-2.5">
                {DAY_OPTIONS.map((o) => (
                  <label key={o.key} className="flex items-center gap-3 text-sm text-slate-200">
                    <input type="checkbox" checked={settings[o.key]} onChange={(e) => setSettings({ ...settings, [o.key]: e.target.checked })} className="h-4 w-4 accent-[#1f4fd8]" />
                    {t(o.label)}
                  </label>
                ))}
              </div>
            </Panel>
            <button type="button" onClick={saveSettings} disabled={busy} className={`${buttonPrimary} self-start`}>
              {t(busy ? "j.saving" : "j.rules.saveSettings")}
            </button>
          </div>

          <Panel title={t("j.rules.checklist")}>
            <p className="text-xs text-slate-500 mb-3">{t("j.rules.checklistHelp")}</p>
            <ol className="flex flex-col divide-y divide-slate-800 border border-slate-800">
              {rules.map((rule, i) => (
                <li key={rule.id} className="flex items-center gap-2 p-2">
                  <span className="w-6 text-center font-mono text-xs text-slate-500">{i + 1}</span>
                  <input
                    value={rule.label}
                    onChange={(e) => setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, label: e.target.value } : r)))}
                    onBlur={(e) => e.target.value.trim() && updateRule({ ...rule, label: e.target.value.trim() })}
                    className={`${inputClass} ${rule.active ? "" : "opacity-50"}`}
                    aria-label={t("j.rules.ruleLabel", { n: i + 1 })}
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                    <input type="checkbox" checked={rule.active} onChange={(e) => updateRule({ ...rule, active: e.target.checked })} className="h-4 w-4 accent-[#1f4fd8]" />
                    {t("j.rules.active")}
                  </label>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("j.rules.moveUp")} className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rules.length - 1} aria-label={t("j.rules.moveDown")} className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeRule(rule.id)} aria-label={t("j.delete")} className="px-2 py-1 text-slate-500 hover:text-rose-400">✕</button>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex gap-2">
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRule())}
                placeholder={t("j.rules.newRule")}
                maxLength={200}
                className={inputClass}
              />
              <button type="button" onClick={addRule} disabled={busy || !newRule.trim()} className={buttonSecondary}>
                {t("j.add")}
              </button>
            </div>
          </Panel>
        </div>
      )}
    </Page>
  );
}
