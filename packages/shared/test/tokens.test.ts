import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { tokens } from "../src/tokens";

const source = JSON.parse(readFileSync(resolve(__dirname, "../../../handoff/design/tokens.json"), "utf8"));

describe("tokens.gen.ts", () => {
  it("ist synchron mit handoff/design/tokens.json (sonst `pnpm tokens` laufen lassen)", () => {
    const { _info, fontSizeRule, ...rest } = source;
    void _info;
    void fontSizeRule;
    expect(tokens).toEqual(rest);
  });

  it("hat für hell und dunkel dieselben Farbnamen", () => {
    expect(Object.keys(tokens.color.dark).sort()).toEqual(Object.keys(tokens.color.light).sort());
  });
});
