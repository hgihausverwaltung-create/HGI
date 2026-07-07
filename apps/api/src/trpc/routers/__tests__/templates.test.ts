import { describe, expect, it, vi } from "vitest";
import { parseTemplateSchema } from "@hgi/form-schema";
import { templatesRouter } from "../templates";
import type { Context } from "../../context";

const TEMPLATE_ID = "11111111-1111-1111-1111-111111111111";

const validSchema = {
  sections: [{ id: "s1", title: "Section 1", fields: [{ id: "f1", type: "text", label: "Feld 1" }] }],
};
// parseSchemaOrThrow re-parses the input, filling in zod defaults (collapsible, required, ...) —
// assertions on what gets persisted must compare against this parsed shape, not the raw input.
const parsedValidSchema = parseTemplateSchema(validSchema);

const adminUser = { id: "admin-1", role: "ADMIN" } as Context["user"];

function makeCtx(prisma: Partial<Context["prisma"]>): Context {
  return { prisma: prisma as Context["prisma"], user: adminUser };
}

/** Fills in every field required by the router's `.output()` schemas so mocked resolvers pass output validation. */
function makeVersion(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "v1",
    templateId: TEMPLATE_ID,
    versionNumber: 1,
    status: "DRAFT",
    schema: validSchema,
    publishedAt: null,
    publishedById: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: TEMPLATE_ID,
    key: "test",
    name: "Test",
    description: null,
    icon: null,
    isArchived: false,
    currentVersionId: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("templatesRouter.getById", () => {
  it("throws NOT_FOUND when the template does not exist", async () => {
    const prisma = { template: { findUnique: vi.fn().mockResolvedValue(null) } };
    const caller = templatesRouter.createCaller(makeCtx(prisma));
    await expect(caller.getById({ id: "00000000-0000-0000-0000-000000000000" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("templatesRouter.create", () => {
  it("rejects an invalid schema with BAD_REQUEST before touching the database", async () => {
    const findUnique = vi.fn();
    const prisma = { template: { findUnique, create: vi.fn() } };
    const caller = templatesRouter.createCaller(makeCtx(prisma));

    await expect(
      caller.create({ key: "test", name: "Test", schema: { sections: [] } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("rejects a duplicate key with CONFLICT", async () => {
    const prisma = {
      template: {
        findUnique: vi.fn().mockResolvedValue(makeTemplate()),
        create: vi.fn(),
      },
    };
    const caller = templatesRouter.createCaller(makeCtx(prisma));

    await expect(caller.create({ key: "uebergabeprotokoll", name: "Test", schema: validSchema })).rejects.toMatchObject(
      { code: "CONFLICT" },
    );
    expect(prisma.template.create).not.toHaveBeenCalled();
  });

  it("creates the template with a single DRAFT version on valid input", async () => {
    const create = vi.fn().mockResolvedValue(makeTemplate({ versions: [makeVersion()] }));
    const prisma = { template: { findUnique: vi.fn().mockResolvedValue(null), create } };
    const caller = templatesRouter.createCaller(makeCtx(prisma));

    await caller.create({ key: "test", name: "Test", schema: validSchema });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          key: "test",
          versions: { create: expect.objectContaining({ versionNumber: 1, status: "DRAFT" }) },
        }),
      }),
    );
  });
});

describe("templatesRouter.updateDraft", () => {
  it("throws NOT_FOUND when the template does not exist", async () => {
    const prisma = { template: { findUnique: vi.fn().mockResolvedValue(null) } };
    const caller = templatesRouter.createCaller(makeCtx(prisma));
    await expect(
      caller.updateDraft({ templateId: "00000000-0000-0000-0000-000000000000", schema: validSchema }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("updates the existing version in place when the latest version is still a DRAFT", async () => {
    const templateVersionUpdate = vi.fn().mockResolvedValue(makeVersion());
    const templateVersionCreate = vi.fn();
    const prisma = {
      template: {
        findUnique: vi.fn().mockResolvedValue(makeTemplate({ versions: [makeVersion({ versionNumber: 1, status: "DRAFT" })] })),
        update: vi.fn(),
      },
      templateVersion: { update: templateVersionUpdate, create: templateVersionCreate },
    };
    const caller = templatesRouter.createCaller(makeCtx(prisma));

    await caller.updateDraft({ templateId: TEMPLATE_ID, schema: validSchema });

    expect(templateVersionUpdate).toHaveBeenCalledWith({ where: { id: "v1" }, data: { schema: parsedValidSchema } });
    expect(templateVersionCreate).not.toHaveBeenCalled();
  });

  it("creates a new DRAFT version when the latest version is already PUBLISHED", async () => {
    const templateVersionCreate = vi.fn().mockResolvedValue(makeVersion({ id: "v2", versionNumber: 2 }));
    const templateVersionUpdate = vi.fn();
    const prisma = {
      template: {
        findUnique: vi.fn().mockResolvedValue(
          makeTemplate({ versions: [makeVersion({ versionNumber: 1, status: "PUBLISHED" })] }),
        ),
        update: vi.fn(),
      },
      templateVersion: { update: templateVersionUpdate, create: templateVersionCreate },
    };
    const caller = templatesRouter.createCaller(makeCtx(prisma));

    await caller.updateDraft({ templateId: TEMPLATE_ID, schema: validSchema });

    expect(templateVersionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ templateId: TEMPLATE_ID, versionNumber: 2, status: "DRAFT" }) }),
    );
    expect(templateVersionUpdate).not.toHaveBeenCalled();
  });
});

describe("templatesRouter.publish", () => {
  it("throws NOT_FOUND when the template does not exist", async () => {
    const prisma = { template: { findUnique: vi.fn().mockResolvedValue(null) } };
    const caller = templatesRouter.createCaller(makeCtx(prisma));
    await expect(caller.publish({ templateId: "00000000-0000-0000-0000-000000000000" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws BAD_REQUEST when there is no unpublished draft to publish", async () => {
    const prisma = {
      template: {
        findUnique: vi.fn().mockResolvedValue(
          makeTemplate({ versions: [makeVersion({ status: "PUBLISHED" })] }),
        ),
      },
    };
    const caller = templatesRouter.createCaller(makeCtx(prisma));
    await expect(caller.publish({ templateId: TEMPLATE_ID })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("publishes the latest draft and points the template's currentVersionId at it", async () => {
    const templateVersionUpdate = vi.fn().mockResolvedValue(makeVersion({ status: "PUBLISHED" }));
    const templateUpdate = vi.fn();
    const prisma = {
      template: {
        findUnique: vi.fn().mockResolvedValue(
          makeTemplate({ versions: [makeVersion({ versionNumber: 1, status: "DRAFT" })] }),
        ),
        update: templateUpdate,
      },
      templateVersion: { update: templateVersionUpdate },
    };
    const caller = templatesRouter.createCaller(makeCtx(prisma));

    await caller.publish({ templateId: TEMPLATE_ID });

    expect(templateVersionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: expect.objectContaining({ status: "PUBLISHED", publishedById: adminUser!.id }),
      }),
    );
    expect(templateUpdate).toHaveBeenCalledWith({ where: { id: TEMPLATE_ID }, data: { currentVersionId: "v1" } });
  });

  it("rejects publishing a draft whose stored schema is no longer valid", async () => {
    const prisma = {
      template: {
        findUnique: vi.fn().mockResolvedValue(
          makeTemplate({ versions: [makeVersion({ versionNumber: 1, status: "DRAFT", schema: { sections: [] } })] }),
        ),
      },
    };
    const caller = templatesRouter.createCaller(makeCtx(prisma));
    await expect(caller.publish({ templateId: TEMPLATE_ID })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
