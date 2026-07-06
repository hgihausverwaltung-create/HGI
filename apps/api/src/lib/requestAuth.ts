import type { FastifyRequest } from "fastify";
import { prisma } from "./prisma";
import { verifySessionToken } from "./auth";

export async function requireUserFromRequest(req: FastifyRequest) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  const session = token ? verifySessionToken(token) : null;
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  return user && user.isActive ? user : null;
}
