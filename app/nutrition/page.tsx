"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalorieSummary } from "@/components/CalorieSummary";
import { MealList } from "@/components/MealList";
import { NutritionHeader } from "@/components/NutritionHeader";
import { NutritionProfileForm } from "@/components/NutritionProfileForm";
import { calculateNutritionTotals, calculateTargets, getTodayNutritionDay } from "@/lib/nutrition";
import { loadActiveDay, loadNutritionDays, loadNutritionProfile, loadPlan, loadSessions, saveNutritionDays, saveNutritionProfile } from "@/lib/storage";
import type { MealEntry, NutritionDay, NutritionProfile, WorkoutPlan, WorkoutSession } from "@/lib/types";
import { defaultPlan } from "@/lib/defaultPlan";
import { getOrCreateSession } from "@/lib/workout";

const mealId = () => `meal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export default function NutritionPage() {
  const [profile, setProfile] = useState<NutritionProfile | null>(null); const [days, setDays] = useState<NutritionDay[]>([]); const [plan, setPlan] = useState<WorkoutPlan | null>(null); const [sessions, setSessions] = useState<WorkoutSession[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { setProfile(loadNutritionProfile()); setDays(loadNutritionDays()); setPlan(loadPlan() ?? defaultPlan); setSessions(loadSessions()); setReady(true); }, []);
  const saveProfile = (next: NutritionProfile) => { setProfile(next); saveNutritionProfile(next); };
  const saveToday = (next: NutritionDay) => { const nextDays = days.some((day) => day.date === next.date) ? days.map((day) => day.date === next.date ? next : day) : [...days, next]; setDays(nextDays); saveNutritionDays(nextDays); };
  if (!ready) return <AppShell><p className="muted">Loading nutrition…</p></AppShell>;
  if (!profile) return <AppShell><h1 className="page-title">Nutrition</h1><p className="muted" style={{ margin: "8px 0 24px" }}>Add your body details to estimate today’s energy needs.</p><NutritionProfileForm profile={null} onSave={saveProfile} /></AppShell>;
  const today = getTodayNutritionDay(days); const targets = calculateTargets(profile); const totals = calculateNutritionTotals(today); const activeDay = plan?.days.find((day) => day.id === loadActiveDay()) ?? plan?.days[0]; const workoutSession = activeDay ? getOrCreateSession(sessions, activeDay) : undefined;
  return <AppShell><NutritionHeader profile={profile} /><CalorieSummary targets={targets} totals={totals} workoutSession={workoutSession} /><MealList meals={today.meals} onAdd={(meal) => saveToday({ ...today, meals: [...today.meals, { ...meal, id: mealId() }] })} onUpdate={(id, next) => saveToday({ ...today, meals: today.meals.map((meal) => meal.id === id ? { ...next, id } : meal) })} onDelete={(id) => saveToday({ ...today, meals: today.meals.filter((meal) => meal.id !== id) })} /><p className="muted" style={{ marginTop: 30, fontSize: 12 }}>All calorie and macro targets are estimates, not medical advice. Protein and fat are weight-based estimates; carbs use remaining calories.</p><Link className="muted" style={{ display: "inline-block", marginTop: 10, fontSize: 13 }} href="/nutrition/settings">View or change target settings →</Link></AppShell>;
}
