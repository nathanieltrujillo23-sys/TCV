import { describe, expect, it } from "vitest";
import { secondsUntilAllowed, validateContact } from "./contactForm";

const ok = { name: "Ada", email: "ada@example.com", message: "Hello" };

describe("validateContact", () => {
  it("accepts a complete message", () => {
    expect(validateContact(ok)).toBeNull();
  });
  it("requires a name", () => {
    expect(validateContact({ ...ok, name: "  " })).toBe("contact.error.name");
  });
  it("rejects an invalid email", () => {
    expect(validateContact({ ...ok, email: "ada@" })).toBe("contact.error.email");
  });
  it("requires a message", () => {
    expect(validateContact({ ...ok, message: "" })).toBe("contact.error.message");
  });
  it("rejects messages over 5,000 characters", () => {
    expect(validateContact({ ...ok, message: "x".repeat(5001) })).toBe("contact.error.tooLong");
  });
});

describe("secondsUntilAllowed", () => {
  it("allows the first message", () => {
    expect(secondsUntilAllowed(null, 1_000)).toBe(0);
  });
  it("blocks within 30 seconds and rounds up", () => {
    expect(secondsUntilAllowed(0, 100)).toBe(30);
    expect(secondsUntilAllowed(0, 29_001)).toBe(1);
  });
  it("allows again after 30 seconds", () => {
    expect(secondsUntilAllowed(0, 30_000)).toBe(0);
  });
});
