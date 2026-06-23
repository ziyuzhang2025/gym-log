"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ExerciseCard } from "@/components/ExerciseCard";
import { WorkoutHeader } from "@/components/WorkoutHeader";
import { WorkoutBurnForm } from "@/components/WorkoutBurnForm";
import { defaultPlan } from "@/lib/defaultPlan";
import { loadActiveDay, loadPlan, loadSessions, saveActiveDay, savePlan, saveSessions } from "@/lib/storage";
import type { CompletedSet, WorkoutPlan, WorkoutSession } from "@/lib/types";
import { getOrCreateSession, progress, updateSet } from "@/lib/workout";
import { defaultSessionType, workoutBurnEstimate } from "@/lib/workoutBurn";

export default function Home() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeDayId, setActiveDayId] = useState("");

  useEffect(() => { const savedPlan = loadPlan() ?? defaultPlan; if (!loadPlan()) savePlan(savedPlan); const savedSessions = loadSessions(); const dayId = loadActiveDay() ?? savedPlan.days[0]?.id ?? ""; const day = savedPlan.days.find((item) => item.id === dayId) ?? savedPlan.days[0]; if (day) { const session = getOrCreateSession(savedSessions, day); const nextSessions = savedSessions.some((item) => item.id === session.id) ? savedSessions.map((item) => item.id === session.id ? session : item) : [...savedSessions, session]; setSessions(nextSessions); saveSessions(nextSessions); } else setSessions(savedSessions); setPlan(savedPlan); setActiveDayId(day?.id ?? ""); }, []);
  if (!plan) return <AppShell><p className="muted">Loading your log…</p></AppShell>;
  if (!plan.days.length) return <AppShell><h1 className="page-title">Gym Log</h1><EmptyState /></AppShell>;
  const activeDay = plan.days.find((day) => day.id === activeDayId) ?? plan.days[0];
  const session = getOrCreateSession(sessions, activeDay);
  const status = progress(activeDay, session);
  const persistSession = (next: WorkoutSession) => { const saved = sessions.some((item) => item.id === next.id) ? sessions.map((item) => item.id === next.id ? next : item) : [...sessions, next]; setSessions(saved); saveSessions(saved); };
  const changeDay = (id: string) => { const day = plan.days.find((item) => item.id === id); if (day) persistSession(getOrCreateSession(sessions, day)); setActiveDayId(id); saveActiveDay(id); };
  const changeSet = (exerciseId: string, setIndex: number, change: Partial<CompletedSet>) => persistSession(updateSet(activeDay, session, { exerciseId, setIndex, ...change }));

  return <AppShell><WorkoutHeader days={plan.days} activeDayId={activeDay.id} onDayChange={changeDay} {...status} />{status.done === status.total && status.total > 0 && <WorkoutBurnForm estimate={session.burnEstimate} defaultType={defaultSessionType(activeDay.name)} onSave={(duration, effort, sessionType) => persistSession({ ...session, burnEstimate: workoutBurnEstimate(duration, effort, sessionType) })} />}{activeDay.exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} sets={session.sets.filter((set) => set.exerciseId === exercise.id).sort((a, b) => a.setIndex - b.setIndex)} onSetChange={(setIndex, change) => changeSet(exercise.id, setIndex, change)} />)}</AppShell>;
}
