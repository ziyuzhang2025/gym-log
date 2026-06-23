export type WorkoutPlan = { id: string; name: string; days: WorkoutDay[] };
export type WorkoutDay = { id: string; name: string; exercises: Exercise[] };
export type Exercise = { id: string; name: string; targetSets: number; targetReps: string; targetWeight?: string };
export type WorkoutEffort = "easy" | "moderate" | "hard";
export type WorkoutSessionType = "upper" | "lower" | "full_body" | "accessory";
export type WorkoutBurnEstimate = { durationMinutes: number; effort: WorkoutEffort; sessionType: WorkoutSessionType; lowCalories: number; highCalories: number; estimatedAt: string };
export type WorkoutSession = { id: string; date: string; workoutDayId: string; workoutDayName: string; sets: CompletedSet[]; completed: boolean; burnEstimate?: WorkoutBurnEstimate };
export type CompletedSet = { exerciseId: string; setIndex: number; done: boolean; actualReps?: string; actualWeight?: string };

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type NutritionGoal = "bulk" | "cut" | "maintain";
export type NutritionProfile = { gender: Gender; age: number; heightCm: number; weightKg: number; activityLevel: ActivityLevel; goal: NutritionGoal; calorieAdjustment?: number };
export type MealEntry = { id: string; name: string; calories: number; protein: number; fat: number; carbs: number };
export type NutritionDay = { date: string; meals: MealEntry[] };
export type NutritionTargets = { bmr: number; tdee: number; targetCalories: number; protein: number; fat: number; carbs: number };
