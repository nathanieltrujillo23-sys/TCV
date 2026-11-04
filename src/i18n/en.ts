import { common } from "./strings/common";
import { site } from "./strings/site";
import { app } from "./strings/app";
import { portal } from "./strings/portal";
import { contact } from "./strings/contact";
import { legal } from "./strings/legal";
import { auth } from "./strings/auth";
import { account } from "./strings/account";
import { journal } from "./strings/journal";
import { workbook } from "./strings/workbook";

/** English is the source of truth: its keys define every string the app can translate. */
export const en = {
  ...common,
  ...site,
  ...app,
  ...portal,
  ...contact,
  ...legal,
  ...auth,
  ...account,
  ...journal,
  ...workbook,
};

export type StringKey = keyof typeof en;
