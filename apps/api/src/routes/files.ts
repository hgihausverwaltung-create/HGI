import path from "node:path";
import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import { prisma } from "../lib/prisma";
import { requireUserFromRequest } from "../lib/requestAuth";
import { readStoredFile, resolveStoragePath, saveBuffer } from "../lib/storage";

async function collectMultipart(req: FastifyRequest) {
  const fields: Record<string, string> = {};
  let file: { buffer: Buffer; filename: string; mimetype: string } | null = null;

  for await (const part of req.parts()) {
    if (part.type === "file") {
      file = { buffer: await part.toBuffer(), filename: part.filename, mimetype: part.mimetype };
    } else {
      fields[part.fieldname] = part.value as string;
    }
  }
  return { fields, file };
}

export async function registerFileRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } });

  app.post("/uploads", async (req, reply) => {
    const user = await requireUserFromRequest(req);
    if (!user) return reply.code(401).send({ error: "Anmeldung erforderlich" });

    const { fields, file } = await collectMultipart(req);
    const { draftId, fieldPath, kind } = fields;
    if (!draftId || !fieldPath || !kind || !file) {
      return reply.code(400).send({ error: "draftId, fieldPath, kind und Datei sind erforderlich" });
    }
    if (kind !== "PHOTO" && kind !== "SIGNATURE") {
      return reply.code(400).send({ error: "Ungültiger Anhang-Typ" });
    }

    const draft = await prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft) return reply.code(404).send({ error: "Entwurf nicht gefunden" });
    if (draft.status === "SENT") return reply.code(400).send({ error: "Versendete Protokolle sind unveränderlich" });

    const extension = path.extname(file.filename).replace(".", "") || "bin";
    const storageKey = saveBuffer(file.buffer, extension);

    const attachment = await prisma.attachment.create({
      data: {
        clientUuid: randomUUID(),
        draftId,
        fieldPath,
        kind,
        storageKey,
        mimeType: file.mimetype,
        uploadStatus: "UPLOADED",
      },
    });

    return reply.send({ attachment });
  });

  app.get<{ Params: { id: string } }>("/attachments/:id/file", async (req, reply) => {
    const user = await requireUserFromRequest(req);
    if (!user) return reply.code(401).send({ error: "Anmeldung erforderlich" });

    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
    if (!attachment?.storageKey) return reply.code(404).send({ error: "Anhang nicht gefunden" });

    const buffer = readStoredFile(attachment.storageKey);
    reply.header("Content-Type", attachment.mimeType ?? "application/octet-stream");
    return reply.send(buffer);
  });

  app.get<{ Params: { id: string } }>("/send-logs/:id/pdf", async (req, reply) => {
    const user = await requireUserFromRequest(req);
    if (!user) return reply.code(401).send({ error: "Anmeldung erforderlich" });

    const sendLog = await prisma.sendLog.findUnique({ where: { id: req.params.id } });
    if (!sendLog?.pdfStorageKey) return reply.code(404).send({ error: "PDF nicht gefunden" });

    const buffer = readStoredFile(sendLog.pdfStorageKey);
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `inline; filename="${path.basename(resolveStoragePath(sendLog.pdfStorageKey))}"`);
    return reply.send(buffer);
  });
}
