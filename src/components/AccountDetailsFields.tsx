import { useT } from "../i18n/LanguageContext";
import type { StringKey } from "../i18n/en";
import { EMPLOYMENT_OPTIONS, type Employment } from "../lib/access";
import type { AccountDetailsValue } from "../lib/accountDetails";

const inputClass =
  "w-full bg-paper border border-line px-3 py-2.5 text-ink text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium border transition-colors ${
        active ? "border-accent bg-accent text-white" : "border-line bg-paper text-ink-soft hover:text-ink hover:border-ink/40"
      }`}
    >
      {children}
    </button>
  );
}

/** Individual or business, then employment (individuals) or "does it trade" (businesses). */
export function AccountDetailsFields({
  value,
  onChange,
  businessName,
  typeLabelKey = "account.type.label",
}: {
  value: AccountDetailsValue;
  onChange: (next: AccountDetailsValue) => void;
  businessName?: { value: string; onChange: (name: string) => void };
  typeLabelKey?: StringKey;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium mb-1.5">{t(typeLabelKey)}</legend>
        <div className="flex gap-2">
          <Choice active={value.accountType === "person"} onClick={() => onChange({ ...value, accountType: "person" })}>
            {t("account.type.person")}
          </Choice>
          <Choice active={value.accountType === "business"} onClick={() => onChange({ ...value, accountType: "business" })}>
            {t("account.type.business")}
          </Choice>
        </div>
      </fieldset>

      {value.accountType === "person" && (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("account.employment.label")}
          <select
            value={value.employment ?? ""}
            onChange={(e) => onChange({ ...value, employment: (e.target.value || null) as Employment | null })}
            className={inputClass}
          >
            <option value="">{t("account.employment.choose")}</option>
            {EMPLOYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`account.employment.${option}` as StringKey)}
              </option>
            ))}
          </select>
        </label>
      )}

      {value.accountType === "business" && (
        <>
          {businessName && (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("account.businessName")}
              <input
                type="text"
                value={businessName.value}
                onChange={(e) => businessName.onChange(e.target.value)}
                autoComplete="organization"
                className={inputClass}
              />
            </label>
          )}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium mb-1.5">{t("account.trades.label")}</legend>
            <div className="flex gap-2">
              <Choice active={value.businessTrades} onClick={() => onChange({ ...value, businessTrades: true })}>
                {t("account.trades.yes")}
              </Choice>
              <Choice active={!value.businessTrades} onClick={() => onChange({ ...value, businessTrades: false })}>
                {t("account.trades.no")}
              </Choice>
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}
