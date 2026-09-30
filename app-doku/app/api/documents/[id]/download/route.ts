import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/documents/[id]/download">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Nicht angemeldet", { status: 401 });
  }

  const { id } = await ctx.params;
  const dokument = await prisma.dokument.findUnique({ where: { id } });
  if (!dokument) {
    return new Response("Dokument nicht gefunden", { status: 404 });
  }

  const buffer = await storage.get(dokument.speicherPfad);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": dokument.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(dokument.dateiname)}"`,
      "Content-Length": String(dokument.dateigroesse),
    },
  });
}
