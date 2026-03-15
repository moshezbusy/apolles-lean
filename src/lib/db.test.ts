import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockPrismaClient = {
  $connect: ReturnType<typeof vi.fn>;
  $disconnect: ReturnType<typeof vi.fn>;
  $executeRaw: ReturnType<typeof vi.fn>;
};

const prismaClientMock = vi.fn<() => MockPrismaClient>();

function clearGlobalPrisma() {
  delete (globalThis as { prisma?: unknown }).prisma;
}

describe("db singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    clearGlobalPrisma();
    prismaClientMock.mockReset();
    prismaClientMock.mockImplementation(function MockPrismaClient() {
      return {
        $connect: vi.fn(),
        $disconnect: vi.fn(),
        $executeRaw: vi.fn(),
      };
    });
  });

  afterEach(() => {
    vi.doUnmock("@prisma/client");
    vi.resetModules();
    clearGlobalPrisma();
  });

  it("creates and caches one Prisma client across module reloads in development", async () => {
    vi.doMock("@prisma/client", () => ({
      PrismaClient: prismaClientMock,
    }));

    const firstModule = await import("~/lib/db");
    const firstInstance = firstModule.db;

    expect(prismaClientMock).toHaveBeenCalledTimes(1);
    expect((globalThis as { prisma?: unknown }).prisma).toBe(firstInstance);

    vi.resetModules();
    vi.doMock("@prisma/client", () => ({
      PrismaClient: prismaClientMock,
    }));

    const secondModule = await import("~/lib/db");

    expect(secondModule.db).toBe(firstInstance);
    expect(prismaClientMock).toHaveBeenCalledTimes(1);
  });

  it("reuses an existing global prisma instance without constructing a new client", async () => {
    const existingClient: MockPrismaClient = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $executeRaw: vi.fn(),
    };
    (globalThis as { prisma?: unknown }).prisma = existingClient;

    vi.doMock("@prisma/client", () => ({
      PrismaClient: prismaClientMock,
    }));

    const { db } = await import("~/lib/db");

    expect(db).toBe(existingClient);
    expect(prismaClientMock).not.toHaveBeenCalled();
  });
});
