import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("meal nutrition inputs use editable text drafts so users can clear them before typing", () => {
  const source = readFileSync(new URL("../components/MealForm.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /type="number"/);
  assert.doesNotMatch(source, /Number\(next\) \|\| 0/);
  assert.match(source, /inputMode="decimal"/);
});
