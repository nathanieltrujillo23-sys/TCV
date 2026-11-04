// High impact news days for the stand-aside calendar. Edit this list by hand.
//
// Sources, fetched 2026-11-04:
//   CPI:  https://www.bls.gov/schedule/news_release/cpi.htm (upcoming) and
//         https://www.bls.gov/bls/news-release/cpi.htm (2026 releases already out,
//         dates read from the archive file names)
//   NFP:  https://www.bls.gov/schedule/news_release/empsit.htm (upcoming) and
//         https://www.bls.gov/bls/news-release/empsit.htm (2026 releases already out)
//   FOMC: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
//         (the decision day, the second day of each meeting; 2027 dates are
//         tentative until confirmed at the previous meeting)

export type EventKind = "cpi" | "nfp" | "fomc";

export interface EventDay {
  date: string; // yyyy-mm-dd, New York date
  kind: EventKind;
}

const CPI = [
  "2026-02-13", "2026-03-11", "2026-04-10", "2026-05-12", "2026-06-10", "2026-07-14",
  "2026-08-12", "2026-09-11", "2026-10-14", "2026-11-10", "2026-12-10",
  "2027-01-13", "2027-02-11", "2027-03-10", "2027-04-13", "2027-05-12", "2027-06-10",
  "2027-07-14", "2027-08-11", "2027-09-14", "2027-10-14", "2027-11-10", "2027-12-10",
];

const NFP = [
  "2026-02-11", "2026-03-06", "2026-04-03", "2026-05-08", "2026-06-05", "2026-07-02",
  "2026-08-07", "2026-09-04", "2026-10-02", "2026-11-06", "2026-12-04",
  "2027-01-08", "2027-02-05", "2027-03-05", "2027-04-02", "2027-05-07", "2027-06-04",
  "2027-07-02", "2027-08-06", "2027-09-03", "2027-10-08", "2027-11-05", "2027-12-03",
];

const FOMC = [
  "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09",
  "2027-01-27", "2027-03-17", "2027-04-28", "2027-06-09", "2027-07-28", "2027-09-15", "2027-10-27", "2027-12-08",
];

export const EVENT_DAYS: EventDay[] = [
  ...CPI.map((date) => ({ date, kind: "cpi" as const })),
  ...NFP.map((date) => ({ date, kind: "nfp" as const })),
  ...FOMC.map((date) => ({ date, kind: "fomc" as const })),
];
