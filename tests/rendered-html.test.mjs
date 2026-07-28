import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the simplified search-to-compare experience rather than starter preview", async () => {
  const [page, layout, data] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("lib/data/ingestedData.ts", root), "utf8"),
  ]);
  assert.match(page, /Which products would you like to compare/);
  assert.match(page, /function SmartSearch/);
  assert.match(page, /Compare Selected Products/);
  assert.match(page, /DAIKIN POSITIONING SUMMARY/);
  assert.match(page, /VERIFIED DAIKIN EDGE/);
  assert.match(page, /COMPETITIVE GAP \/ ACTION/);
  assert.match(page, /MARKETING TAKEAWAYS/);
  assert.match(page, /ArrowDown/);
  assert.match(page, /function Sources/);
  assert.match(layout, /Daikin Competitive Marketing Intelligence/);
  assert.match(layout, /og\.png/);
  assert.equal((data.match(/"model"/g) ?? []).length, 28);
  assert.match(data, /DH7VS FIT/);
  assert.match(data, /RD18AY/);
});
