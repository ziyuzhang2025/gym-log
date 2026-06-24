import assert from "node:assert/strict";
import test from "node:test";
import {
  createNutritionProfileDraft,
  nutritionProfileFromDraft,
  updateNutritionProfileDraft,
} from "../lib/nutritionProfileDraft";

test("a height field can be cleared before a new value is entered", () => {
  const draft = createNutritionProfileDraft({
    gender: "male",
    age: 25,
    heightCm: 175,
    weightKg: 70,
    activityLevel: "moderate",
    goal: "maintain",
  });

  const cleared = updateNutritionProfileDraft(draft, "heightCm", "");
  const updated = updateNutritionProfileDraft(cleared, "heightCm", "182.5");

  assert.equal(cleared.heightCm, "");
  assert.equal(nutritionProfileFromDraft(updated).heightCm, 182.5);
});

test("saving a blank required number reports a validation error", () => {
  const draft = createNutritionProfileDraft({
    gender: "female",
    age: 30,
    heightCm: 165,
    weightKg: 55,
    activityLevel: "light",
    goal: "cut",
  });

  const result = nutritionProfileFromDraft(updateNutritionProfileDraft(draft, "weightKg", ""));

  assert.equal(result.error, "Weight must be at least 25 kg.");
});
