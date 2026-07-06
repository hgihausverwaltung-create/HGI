import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PROPERTY_KINDS } from "@hgi/domain";
import { adminProcedure, protectedProcedure, router } from "../trpc";

const propertyInput = z.object({
  name: z.string().min(1),
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  kind: z.enum(PROPERTY_KINDS).default("MIETE"),
  notes: z.string().optional(),
  externalRef: z.string().optional(),
});

export const propertiesRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.property.findMany({ include: { units: true }, orderBy: { name: "asc" } }),
  ),

  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const property = await ctx.prisma.property.findUnique({
      where: { id: input.id },
      include: { units: true },
    });
    if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Objekt nicht gefunden" });
    return property;
  }),

  create: adminProcedure.input(propertyInput).mutation(({ ctx, input }) => ctx.prisma.property.create({ data: input })),

  update: adminProcedure
    .input(propertyInput.partial().extend({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.property.update({ where: { id }, data });
    }),

  addUnit: adminProcedure
    .input(
      z.object({
        propertyId: z.string().uuid(),
        label: z.string().min(1),
        floor: z.string().optional(),
        notes: z.string().optional(),
        externalRef: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.prisma.unit.create({ data: input })),

  updateUnit: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().min(1).optional(),
        floor: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.unit.update({ where: { id }, data });
    }),
});
