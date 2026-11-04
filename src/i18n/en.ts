import { common } from "./strings/common";
import { site } from "./strings/site";
import { app } from "./strings/app";
import { portal } from "./strings/portal";
import { contact } from "./strings/contact";
import { legal } from "./strings/legal";
import { auth } from "./strings/auth";

/** English is the source of truth: its keys define every string the app can translate. */
export const en = {
  ...common,
  ...site,
  ...app,
  ...portal,
  ...contact,
  ...legal,
  ...auth,
};

export type StringKey = keyof typeof en;
