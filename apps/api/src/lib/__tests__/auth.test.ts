import { describe, expect, it } from "vitest";
import { hashPassword, signSessionToken, verifyPassword, verifySessionToken } from "../auth";

describe("hashPassword / verifyPassword", () => {
  it("produces a hash that verifyPassword accepts for the correct plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips the payload through a signed token", () => {
    const token = signSessionToken({ sub: "user-1", role: "ADMIN" });
    const payload = verifySessionToken(token);
    expect(payload).toMatchObject({ sub: "user-1", role: "ADMIN" });
  });

  it("returns null instead of throwing for a malformed token", () => {
    expect(verifySessionToken("not-a-valid-jwt")).toBeNull();
  });

  it("returns null for a token signed with a different secret", () => {
    // A structurally valid JWT (header.payload.signature) whose signature won't match env.jwtSecret.
    const foreignToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiQURNSU4ifQ.invalidsignature";
    expect(verifySessionToken(foreignToken)).toBeNull();
  });
});
