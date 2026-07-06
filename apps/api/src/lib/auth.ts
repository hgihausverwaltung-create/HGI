import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env";
import type { Role } from "@hgi/domain";

export interface SessionTokenPayload {
  sub: string; // user id
  role: Role;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as SessionTokenPayload;
  } catch {
    return null;
  }
}
