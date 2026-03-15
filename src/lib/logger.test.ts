import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "~/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("writes structured info logs", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logger.info("hello", { source: "unit-test" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;

    expect(payload.level).toBe("info");
    expect(payload.message).toBe("hello");
    expect(payload.context).toEqual({ source: "unit-test" });
    expect(typeof payload.timestamp).toBe("string");
  });

  it("writes errors to stdout", () => {
    const logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    logger.error("boom");

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;
    expect(payload.level).toBe("error");
    expect(payload.message).toBe("boom");
  });

  it("writes warnings to stdout", () => {
    const logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    logger.warn("caution", { detail: "low disk" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;
    expect(payload.level).toBe("warn");
    expect(payload.message).toBe("caution");
    expect(payload.context).toEqual({ detail: "low disk" });
  });

  it("writes debug logs to console.log", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logger.debug("trace");

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;
    expect(payload.level).toBe("debug");
    expect(payload.message).toBe("trace");
  });

  it("omits context field when no context provided", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logger.info("no-context");

    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;
    expect(payload).not.toHaveProperty("context");
  });

  it("serializes Error objects in context", () => {
    const logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    logger.error("failed", {
      error: new Error("kaboom"),
      metadata: { retriable: false },
    });

    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;

    expect(payload.context).toMatchObject({
      error: {
        name: "Error",
        message: "kaboom",
      },
      metadata: {
        retriable: false,
      },
    });
  });

  it("handles circular context without throwing", () => {
    const logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const context: Record<string, unknown> = { source: "self-ref" };
    context.self = context;

    expect(() => logger.info("circular", context)).not.toThrow();

    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;

    expect(payload.context).toMatchObject({
      source: "self-ref",
      self: "[Circular]",
    });
  });
});
