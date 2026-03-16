import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("global accessibility tokens", () => {
  it("defines the 2px primary focus outline and 2px offset", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain("*:focus-visible");
    expect(css).toContain("outline: 2px solid var(--color-primary);");
    expect(css).toContain("outline-offset: 2px;");
  });
});
