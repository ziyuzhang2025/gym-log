import type { ActivityLevel, NutritionDay, NutritionProfile, NutritionTargets } from "./types";

const activityMultipliers: Record<ActivityLevel, number> = { sedentary: 1.2, light: 1.3, moderate: 1.45, active: 1.6, very_active: 1.6 };
export const nutritionDate = () => new Date().toISOString().slice(0, 10);
export function calculateBmr(profile: NutritionProfile) {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(base + (profile.gender === "male" ? 5 : -161));
}
export function calculateTargets(profile: NutritionProfile): NutritionTargets {
  const bmr = calculateBmr(profile);
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);
  const adjustment = profile.calorieAdjustment ?? (profile.goal === "bulk" ? 250 : profile.goal === "cut" ? -400 : 0);
  const targetCalories = Math.max(0, tdee + adjustment);
  const protein = Math.round(profile.weightKg * (profile.goal === "cut" ? 2 : profile.goal === "bulk" ? 1.8 : 1.6));
  const fat = Math.round(profile.weightKg * (profile.goal === "cut" ? 0.7 : 0.8));
  return { bmr, tdee, targetCalories, protein, fat, carbs: Math.max(0, Math.round((targetCalories - protein * 4 - fat * 9) / 4)) };
}
export function getTodayNutritionDay(days: NutritionDay[]) { return days.find((day) => day.date === nutritionDate()) ?? { date: nutritionDate(), meals: [] }; }
export function calculateNutritionTotals(day: NutritionDay) { return day.meals.reduce((total, meal) => ({ calories: total.calories + meal.calories, protein: total.protein + meal.protein, fat: total.fat + meal.fat, carbs: total.carbs + meal.carbs }), { calories: 0, protein: 0, fat: 0, carbs: 0 }); }
