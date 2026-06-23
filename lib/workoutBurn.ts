import type { WorkoutBurnEstimate, WorkoutEffort, WorkoutSessionType } from "./types";

const kcalPerMinute: Record<WorkoutEffort, number> = { easy: 3.5, moderate: 4.8, hard: 6 };
const sessionTypeFactor: Record<WorkoutSessionType, number> = { upper: 0.9, lower: 1.1, full_body: 1.2, accessory: 0.8 };
const clamp = (min: number, max: number, value: number) => Math.min(max, Math.max(min, value));

export function defaultSessionType(workoutDayName: string): WorkoutSessionType {
  const name = workoutDayName.toLowerCase();
  if (name.includes("lower")) return "lower";
  if (name.includes("back") || name.includes("chest")) return "upper";
  return "full_body";
}

export function workoutBurnEstimate(durationMinutes: number, effort: WorkoutEffort, sessionType: WorkoutSessionType): WorkoutBurnEstimate {
  const center = durationMinutes * kcalPerMinute[effort] * sessionTypeFactor[sessionType];
  const spread = Math.max(25, center * 0.2);
  const lowCalories = Math.round(clamp(50, 900, center - spread));
  const highCalories = Math.max(lowCalories, Math.round(clamp(50, 900, center + spread)));
  return { durationMinutes, effort, sessionType, lowCalories, highCalories, estimatedAt: new Date().toISOString() };
}
