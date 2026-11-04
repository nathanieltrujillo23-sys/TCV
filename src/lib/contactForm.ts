import type { StringKey } from "../i18n/en";

export const CONTACT_COOLDOWN_MS = 30_000;
export const CONTACT_MAX_MESSAGE = 5000;

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns the first problem with the form as a string key, or null when it can be sent. */
export function validateContact(input: ContactInput): StringKey | null {
  if (!input.name.trim()) return "contact.error.name";
  if (!EMAIL_PATTERN.test(input.email.trim())) return "contact.error.email";
  if (!input.message.trim()) return "contact.error.message";
  if (input.message.trim().length > CONTACT_MAX_MESSAGE) return "contact.error.tooLong";
  return null;
}

/** Whole seconds left before another message may be sent (0 means it may be sent now). */
export function secondsUntilAllowed(lastSentAt: number | null, now: number, cooldownMs = CONTACT_COOLDOWN_MS): number {
  if (lastSentAt === null) return 0;
  const remaining = lastSentAt + cooldownMs - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
