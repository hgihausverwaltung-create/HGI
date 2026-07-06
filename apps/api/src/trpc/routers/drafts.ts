import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parseTemplateSchema, validateAnswers, draftAnswersSchema } from "@hgi/form-schema";
import { DRAFT_STATUSES } from "@hgi/domain";
import { protectedProcedure, router } from "../trpc";
import { renderProtocolPdf } from "@hgi/pdf";
import { saveBuffer, resolveStoragePath } from "../../lib/storage";
import { sendEmail } from "../../lib/email";

const draftListItemOutput = z.object({
  id: z.string(),
  clientUuid: z.string(),
  title: z.string(),
  status: z.enum(DRAFT_STATUSES),
  propertyId: z.string().nullable(),
  unitId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sentAt: z.date().nullable(),
  createdBy: z.object({ id: z.string(), name: z.string() }),
});

const attachmentOutput = z.object({
  id: z.string(),
  clientUuid: z.string(),
  fieldPath: z.string(),
  kind: z.enum(["PHOTO", "SIGNATURE"]),
  storageKey: z.string().nullable(),
  uploadStatus: z.enum(["PENDING", "UPLOADED"]),
});

const draftDetailOutput = draftListItemOutput.extend({
  answers: z.unknown(),
  version: z.number(),
  templateVersion: z.object({
    id: z.string(),
    versionNumber: z.number(),
    schema: z.unknown(),
    template: z.object({ id: z.string(), name: z.string() }),
  }),
  attachments: z.array(attachmentOutput),
});

function formatTitleTimestamp(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}. ${hh}:${min}`;
}

export const draftsRouter = router({
  list: protectedProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .output(z.array(draftListItemOutput))
    .query(({ ctx, input }) =>
      ctx.prisma.draft.findMany({
        where: { templateVersion: { templateId: input.templateId } },
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(draftDetailOutput)
    .query(async ({ ctx, input }) => {
      const draft = await ctx.prisma.draft.findUnique({
        where: { id: input.id },
        include: {
          createdBy: { select: { id: true, name: true } },
          attachments: true,
          templateVersion: { include: { template: { select: { id: true, name: true } } } },
        },
      });
      if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "Entwurf nicht gefunden" });
      return draft;
    }),

  create: protectedProcedure
    .input(z.object({ templateId: z.string().uuid(), propertyId: z.string().uuid().optional(), unitId: z.string().uuid().optional() }))
    .output(draftDetailOutput)
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.template.findUnique({ where: { id: input.templateId } });
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Vorlage nicht gefunden" });
      if (!template.currentVersionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Vorlage hat keine veröffentlichte Version" });
      }
      const now = new Date();
      const draft = await ctx.prisma.draft.create({
        data: {
          clientUuid: randomUUID(),
          templateVersionId: template.currentVersionId,
          propertyId: input.propertyId,
          unitId: input.unitId,
          title: `${template.name} ${formatTitleTimestamp(now)}`,
          createdById: ctx.user.id,
          answers: { values: {}, repeatables: {} },
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          attachments: true,
          templateVersion: { include: { template: { select: { id: true, name: true } } } },
        },
      });
      return draft;
    }),

  updateAnswers: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        answers: z.unknown(),
        propertyId: z.string().uuid().optional(),
        unitId: z.string().uuid().optional(),
      }),
    )
    .output(draftDetailOutput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.draft.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Entwurf nicht gefunden" });
      if (existing.status === "SENT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Versendete Protokolle sind unveränderlich" });
      }
      const parsedAnswers = draftAnswersSchema.safeParse(input.answers);
      if (!parsedAnswers.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ungültiges Antwortformat" });
      }
      return ctx.prisma.draft.update({
        where: { id: input.id },
        data: {
          answers: parsedAnswers.data,
          propertyId: input.propertyId,
          unitId: input.unitId,
          version: { increment: 1 },
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          attachments: true,
          templateVersion: { include: { template: { select: { id: true, name: true } } } },
        },
      });
    }),

  deleteAttachment: protectedProcedure.input(z.object({ attachmentId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const attachment = await ctx.prisma.attachment.findUnique({ where: { id: input.attachmentId }, include: { draft: true } });
    if (!attachment) throw new TRPCError({ code: "NOT_FOUND", message: "Anhang nicht gefunden" });
    if (attachment.draft.status === "SENT") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Versendete Protokolle sind unveränderlich" });
    }
    await ctx.prisma.attachment.delete({ where: { id: input.attachmentId } });
    return { ok: true };
  }),

  send: protectedProcedure
    .input(z.object({ id: z.string().uuid(), recipients: z.array(z.string().email()).min(1) }))
    .output(z.object({ status: z.enum(["SENT", "FAILED"]), error: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const draft = await ctx.prisma.draft.findUnique({
        where: { id: input.id },
        include: {
          attachments: true,
          property: true,
          unit: true,
          templateVersion: { include: { template: true } },
        },
      });
      if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "Entwurf nicht gefunden" });
      if (draft.status === "SENT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Dieses Protokoll wurde bereits versendet" });
      }

      const schema = parseTemplateSchema(draft.templateVersion.schema);
      const validation = validateAnswers(schema, draft.answers);
      if (!validation.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Formular ist unvollständig:\n${validation.errors.join("\n")}` });
      }
      const answers = draftAnswersSchema.parse(draft.answers);

      // Resolves "reference" field values (Objekt/Wohnung pickers) to human-readable labels
      // for the PDF — the answer only stores the raw entity id.
      const [allProperties, allUnits] = await Promise.all([ctx.prisma.property.findMany(), ctx.prisma.unit.findMany()]);
      const referenceLabels: Record<string, string> = {
        ...Object.fromEntries(allProperties.map((p) => [p.id, `${p.name}, ${p.street} ${p.houseNumber}`])),
        ...Object.fromEntries(allUnits.map((u) => [u.id, u.label])),
      };

      try {
        const pdfBuffer = await renderProtocolPdf({
          templateName: draft.templateVersion.template.name,
          draftTitle: draft.title,
          schema,
          answers,
          attachments: draft.attachments.map((a) => ({
            fieldPath: a.fieldPath,
            filePath: a.storageKey ? resolveStoragePath(a.storageKey) : null,
          })),
          propertyLabel: draft.property ? `${draft.property.name}, ${draft.property.street} ${draft.property.houseNumber}` : undefined,
          unitLabel: draft.unit?.label,
          referenceLabels,
        });
        const pdfKey = saveBuffer(pdfBuffer, "pdf");

        await sendEmail({
          to: input.recipients,
          subject: draft.title,
          text: `Im Anhang finden Sie das Protokoll "${draft.title}".`,
          attachmentPath: pdfKey,
        });

        await ctx.prisma.$transaction([
          ctx.prisma.sendLog.create({
            data: {
              draftId: draft.id,
              recipients: input.recipients,
              pdfStorageKey: pdfKey,
              provider: "dev-console",
              status: "SENT",
              sentById: ctx.user.id,
            },
          }),
          ctx.prisma.draft.update({
            where: { id: draft.id },
            data: { status: "SENT", sentAt: new Date() },
          }),
        ]);

        return { status: "SENT" as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unbekannter Fehler beim Versenden";
        await ctx.prisma.sendLog.create({
          data: {
            draftId: draft.id,
            recipients: input.recipients,
            status: "FAILED",
            error: message,
            sentById: ctx.user.id,
          },
        });
        await ctx.prisma.draft.update({ where: { id: draft.id }, data: { status: "FAILED" } });
        return { status: "FAILED" as const, error: message };
      }
    }),
});
