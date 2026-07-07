import { describe, expect, it } from "vitest";
import { adminProcedure, protectedProcedure, router } from "../trpc";
import type { Context } from "../context";

const testRouter = router({
  protected: protectedProcedure.query(() => "ok"),
  admin: adminProcedure.query(() => "ok"),
});

function makeCtx(user: Context["user"]): Context {
  return { prisma: {} as Context["prisma"], user };
}

const adminUser = { id: "admin-1", role: "ADMIN" } as Context["user"];
const staffUser = { id: "staff-1", role: "FIELD_STAFF" } as Context["user"];

describe("protectedProcedure", () => {
  it("rejects unauthenticated access", async () => {
    const caller = testRouter.createCaller(makeCtx(null));
    await expect(caller.protected()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("allows authenticated access", async () => {
    const caller = testRouter.createCaller(makeCtx(staffUser));
    await expect(caller.protected()).resolves.toBe("ok");
  });
});

describe("adminProcedure", () => {
  it("rejects unauthenticated users with UNAUTHORIZED (before the role check runs)", async () => {
    const caller = testRouter.createCaller(makeCtx(null));
    await expect(caller.admin()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects authenticated non-admin users with FORBIDDEN", async () => {
    const caller = testRouter.createCaller(makeCtx(staffUser));
    await expect(caller.admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admin users", async () => {
    const caller = testRouter.createCaller(makeCtx(adminUser));
    await expect(caller.admin()).resolves.toBe("ok");
  });
});
