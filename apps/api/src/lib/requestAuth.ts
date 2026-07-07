import type { FastifyRequest } from "fastify";
import { prisma } from "./prisma";
import { verifySessionToken } from "./auth";

export async function requireUserFromRequest(req: FastifyRequest) {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  // Native <Image>/<img> tags can't set an Authorization header, so file-serving GET
  // routes also accept the token as a query param — mutating routes always require the
  // header and never read this fallback.
  const queryToken = typeof (req.query as Record<string, unknown> | undefined)?.token === "string" ? (req.query as Record<string, string>).token : undefined;
  const token = headerToken ?? queryToken;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  return user && user.isActive ? user : null;
}
