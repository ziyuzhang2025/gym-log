import type { NutritionDay, NutritionProfile, WorkoutPlan, WorkoutSession } from "./types";

export const PLAN_KEY = "gym-log-plan";
export const SESSION_KEY = "gym-log-sessions";
export const ACTIVE_DAY_KEY = "gym-log-active-day";
export const NUTRITION_PROFILE_KEY = "gym-log-nutrition-profile";
export const NUTRITION_DAYS_KEY = "gym-log-nutrition-days";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : null; } catch { return null; }
}
function write(key: string, value: unknown) { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value)); }
export const loadPlan = () => read<WorkoutPlan>(PLAN_KEY);
export const savePlan = (plan: WorkoutPlan) => write(PLAN_KEY, plan);
export const loadSessions = () => read<WorkoutSession[]>(SESSION_KEY) ?? [];
export const saveSessions = (sessions: WorkoutSession[]) => write(SESSION_KEY, sessions);
export const loadActiveDay = () => typeof window === "undefined" ? null : window.localStorage.getItem(ACTIVE_DAY_KEY);
export const saveActiveDay = (id: string) => { if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_DAY_KEY, id); };
export const loadNutritionProfile = () => read<NutritionProfile>(NUTRITION_PROFILE_KEY);
export const saveNutritionProfile = (profile: NutritionProfile) => write(NUTRITION_PROFILE_KEY, profile);
export const loadNutritionDays = () => read<NutritionDay[]>(NUTRITION_DAYS_KEY) ?? [];
export const saveNutritionDays = (days: NutritionDay[]) => write(NUTRITION_DAYS_KEY, days);
