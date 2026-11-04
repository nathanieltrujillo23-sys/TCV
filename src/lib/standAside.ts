import { EVENT_DAYS, type EventDay } from "../content/eventDays";
import { thanksgivingDay, usMarketHolidays } from "./marketHolidays";

export type StandAsideReason = "friday" | "cpi" | "nfp" | "fomc" | "holiday" | "thanksgivingWeek" | "lateDecember";

export interface StandAsideSettings {
  avoidFridays: boolean;
  avoidNewsDays: boolean;
  avoidHolidays: boolean;
  avoidThanksgivingWeek: boolean;
  avoidLateDecember: boolean;
}

export interface StandAsideResult {
  standAside: boolean;
  reasons: StandAsideReason[];
}

/** Spec section 5: whether a New York calendar date (yyyy-mm-dd) is a day this trader stands aside, and why. */
export function standAside(date: string, settings: StandAsideSettings, events: EventDay[] = EVENT_DAYS): StandAsideResult {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const reasons: StandAsideReason[] = [];

  if (settings.avoidFridays && weekday === 5) reasons.push("friday");
  if (settings.avoidNewsDays) {
    for (const kind of ["cpi", "nfp", "fomc"] as const) {
      if (events.some((e) => e.date === date && e.kind === kind)) reasons.push(kind);
    }
  }
  if (settings.avoidHolidays && usMarketHolidays(year).has(date)) reasons.push("holiday");
  if (settings.avoidThanksgivingWeek && month === 11) {
    // Monday through Sunday of the week Thanksgiving (a Thursday) falls in.
    const thursday = thanksgivingDay(year);
    if (day >= thursday - 3 && day <= thursday + 3) reasons.push("thanksgivingWeek");
  }
  if (settings.avoidLateDecember && month === 12 && day >= 16) reasons.push("lateDecember");

  return { standAside: reasons.length > 0, reasons };
}
