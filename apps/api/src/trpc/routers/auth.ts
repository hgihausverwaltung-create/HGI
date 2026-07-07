import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ROLES } from "@hgi/domain";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { signSessionToken, verifyPassword } from "../../lib/auth";

/** Explicit output shape for the client, rather than leaking Prisma's generated `User`/`Role` types (see templates.ts for the same pattern). */
const currentUserOutput = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(ROLES),
});

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .output(z.object({ token: z.string(), user: currentUserOutput }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (!user || !user.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-Mail oder Passwort ist falsch" });
      }
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-Mail oder Passwort ist falsch" });
      }
      const token = signSessionToken({ sub: user.id, role: user.role });
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      };
    }),

  me: protectedProcedure.output(currentUserOutput).query(({ ctx }) => ({
    id: ctx.user.id,
    email: ctx.user.email,
    name: ctx.user.name,
    role: ctx.user.role,
  })),
});
