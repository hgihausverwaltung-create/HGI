import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parseTemplateSchema } from "@hgi/form-schema";
import { TEMPLATE_VERSION_STATUSES } from "@hgi/domain";
import { adminProcedure, protectedProcedure, router } from "../trpc";

/**
 * Explicit output shapes for the client, rather than returning raw Prisma results.
 * Prisma's `Json` column type is recursively defined, which combined with tRPC's own
 * generic inference makes TypeScript's checker choke ("Type instantiation is excessively
 * deep") once client code touches `.schema`. Declaring the schema field as `unknown` here
 * breaks that recursion — the actual validation of its shape already happens separately
 * via parseTemplateSchema.
 */
const templateVersionOutput = z.object({
  id: z.string(),
  templateId: z.string(),
  versionNumber: z.number(),
  status: z.enum(TEMPLATE_VERSION_STATUSES),
  schema: z.unknown(),
  publishedAt: z.date().nullable(),
  publishedById: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const baseTemplateFields = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  isArchived: z.boolean(),
  currentVersionId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const templateListItemOutput = baseTemplateFields.extend({
  currentVersion: templateVersionOutput.nullable(),
});

const templateDetailOutput = baseTemplateFields.extend({
  currentVersion: templateVersionOutput.nullable(),
  versions: z.array(templateVersionOutput),
});

const templateCreateOutput = baseTemplateFields.extend({
  versions: z.array(templateVersionOutput),
});

function parseSchemaOrThrow(schema: unknown) {
  try {
    return parseTemplateSchema(schema);
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Ungültiges Vorlagen-Schema",
    });
  }
}

export const templatesRouter = router({
  list: protectedProcedure.output(z.array(templateListItemOutput)).query(async ({ ctx }) => {
    const templates = await ctx.prisma.template.findMany({
      where: { isArchived: false },
      include: { currentVersion: true },
      orderBy: { name: "asc" },
    });
    return templates;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(templateDetailOutput)
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.template.findUnique({
        where: { id: input.id },
        include: {
          currentVersion: true,
          versions: { orderBy: { versionNumber: "desc" } },
        },
      });
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Vorlage nicht gefunden" });
      return template;
    }),

  create: adminProcedure
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .regex(/^[a-z0-9-]+$/, "Nur Kleinbuchstaben, Ziffern und Bindestriche"),
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
        schema: z.unknown(),
      }),
    )
    .output(templateCreateOutput)
    .mutation(async ({ ctx, input }) => {
      const validSchema = parseSchemaOrThrow(input.schema);
      const existing = await ctx.prisma.template.findUnique({ where: { key: input.key } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: `Vorlage mit Schlüssel "${input.key}" existiert bereits` });
      }
      const template = await ctx.prisma.template.create({
        data: {
          key: input.key,
          name: input.name,
          description: input.description,
          icon: input.icon,
          versions: {
            create: {
              versionNumber: 1,
              status: "DRAFT",
              schema: validSchema as object,
            },
          },
        },
        include: { versions: true },
      });
      return template;
    }),

  /** Updates the mutable draft version of a template, creating one if the current version is already published. */
  updateDraft: adminProcedure
    .input(z.object({ templateId: z.string().uuid(), schema: z.unknown(), name: z.string().optional(), description: z.string().optional() }))
    .output(templateVersionOutput)
    .mutation(async ({ ctx, input }) => {
      const validSchema = parseSchemaOrThrow(input.schema);
      const template = await ctx.prisma.template.findUnique({
        where: { id: input.templateId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Vorlage nicht gefunden" });

      if (input.name || input.description !== undefined) {
        await ctx.prisma.template.update({
          where: { id: template.id },
          data: { name: input.name ?? template.name, description: input.description },
        });
      }

      const latest = template.versions[0];
      if (latest && latest.status === "DRAFT") {
        return ctx.prisma.templateVersion.update({
          where: { id: latest.id },
          data: { schema: validSchema as object },
        });
      }

      const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;
      return ctx.prisma.templateVersion.create({
        data: {
          templateId: template.id,
          versionNumber: nextVersionNumber,
          status: "DRAFT",
          schema: validSchema as object,
        },
      });
    }),

  /** Publishes the latest draft version, making it immutable and the new "current" version. */
  publish: adminProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .output(templateVersionOutput)
    .mutation(async ({ ctx, input }) => {
    const template = await ctx.prisma.template.findUnique({
      where: { id: input.templateId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Vorlage nicht gefunden" });
    const latest = template.versions[0];
    if (!latest || latest.status !== "DRAFT") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Kein unveröffentlichter Entwurf vorhanden" });
    }
    parseSchemaOrThrow(latest.schema);

    const published = await ctx.prisma.templateVersion.update({
      where: { id: latest.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), publishedById: ctx.user.id },
    });
    await ctx.prisma.template.update({
      where: { id: template.id },
      data: { currentVersionId: published.id },
    });
    return published;
  }),
});
