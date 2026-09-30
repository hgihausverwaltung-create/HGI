import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Nicht angemeldet");
  }
  return session;
}
