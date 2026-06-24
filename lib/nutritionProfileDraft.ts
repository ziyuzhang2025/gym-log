import type { NutritionProfile } from "./types";

type NumericField = "age" | "heightCm" | "weightKg" | "calorieAdjustment";

export type NutritionProfileDraft = Omit<NutritionProfile, NumericField> & {
  age: string;
  heightCm: string;
  weightKg: string;
  calorieAdjustment: string;
};

export type NutritionProfileValidationResult = NutritionProfile & { error?: string };

export function createNutritionProfileDraft(profile: NutritionProfile): NutritionProfileDraft {
  return {
    ...profile,
    age: String(profile.age),
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    calorieAdjustment: profile.calorieAdjustment === undefined ? "" : String(profile.calorieAdjustment),
  };
}

export function updateNutritionProfileDraft(
  draft: NutritionProfileDraft,
  field: NumericField,
  value: string,
): NutritionProfileDraft {
  return { ...draft, [field]: value };
}

export function nutritionProfileFromDraft(draft: NutritionProfileDraft): NutritionProfileValidationResult {
  const age = Number(draft.age);
  const heightCm = Number(draft.heightCm);
  const weightKg = Number(draft.weightKg);
  const calorieAdjustment = draft.calorieAdjustment === "" ? undefined : Number(draft.calorieAdjustment);
  const profile: NutritionProfile = { gender: draft.gender, age, heightCm, weightKg, activityLevel: draft.activityLevel, goal: draft.goal, calorieAdjustment };

  if (!Number.isInteger(age) || age < 13 || age > 120) return { ...profile, error: "Age must be between 13 and 120." };
  if (!Number.isFinite(heightCm) || heightCm < 100) return { ...profile, error: "Height must be at least 100 cm." };
  if (!Number.isFinite(weightKg) || weightKg < 25) return { ...profile, error: "Weight must be at least 25 kg." };

  if (calorieAdjustment !== undefined && !Number.isFinite(calorieAdjustment)) return { ...profile, error: "Custom calorie adjustment must be a number." };

  return profile;
}
