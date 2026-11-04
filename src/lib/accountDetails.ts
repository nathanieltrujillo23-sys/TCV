import type { StringKey } from "../i18n/en";
import type { AccountType, Employment } from "./access";

export interface AccountDetailsValue {
  accountType: AccountType | null;
  employment: Employment | null;
  businessTrades: boolean;
}

/** First problem with the sign-up answers as a string key, or null when complete. */
export function accountDetailsError(value: AccountDetailsValue): StringKey | null {
  if (!value.accountType) return "account.error.type";
  if (value.accountType === "person" && !value.employment) return "account.error.employment";
  return null;
}
