import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { prisma } from "../lib/prisma";
import { verifySessionToken } from "../lib/auth";

export async function createContext({ req }: CreateFastifyContextOptions) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  const session = token ? verifySessionToken(token) : null;

  const user = session
    ? await prisma.user.findUnique({ where: { id: session.sub } })
    : null;

  return {
    prisma,
    user: user && user.isActive ? user : null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
