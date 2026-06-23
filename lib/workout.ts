import type { CompletedSet, WorkoutDay, WorkoutSession } from "./types";

export const today = () => new Date().toISOString().slice(0, 10);
export function createSession(day: WorkoutDay, date = today()): WorkoutSession {
  return { id: `${date}-${day.id}`, date, workoutDayId: day.id, workoutDayName: day.name, sets: day.exercises.flatMap((exercise) => Array.from({ length: exercise.targetSets }, (_, setIndex) => ({ exerciseId: exercise.id, setIndex, done: false }))), completed: false };
}
export function getOrCreateSession(sessions: WorkoutSession[], day: WorkoutDay) {
  const date = today();
  const existing = sessions.find((session) => session.date === date && session.workoutDayId === day.id);
  return existing ? reconcileSession(day, existing) : createSession(day, date);
}
export function reconcileSession(day: WorkoutDay, session: WorkoutSession): WorkoutSession {
  const previous = new Map(session.sets.map((set) => [`${set.exerciseId}-${set.setIndex}`, set]));
  const sets = day.exercises.flatMap((exercise) => Array.from({ length: exercise.targetSets }, (_, setIndex) => previous.get(`${exercise.id}-${setIndex}`) ?? ({ exerciseId: exercise.id, setIndex, done: false })));
  const next = { ...session, workoutDayName: day.name, sets };
  const completed = progress(day, next).total > 0 && progress(day, next).done === progress(day, next).total;
  return { ...next, completed, burnEstimate: completed ? next.burnEstimate : undefined };
}
export function progress(day: WorkoutDay, session: WorkoutSession) {
  const total = day.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);
  const done = session.sets.filter((set) => set.done && day.exercises.some((exercise) => exercise.id === set.exerciseId && set.setIndex < exercise.targetSets)).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
export function updateSet(day: WorkoutDay, session: WorkoutSession, change: Partial<CompletedSet> & Pick<CompletedSet, "exerciseId" | "setIndex">): WorkoutSession {
  const sets = session.sets.map((set) => set.exerciseId === change.exerciseId && set.setIndex === change.setIndex ? { ...set, ...change } : set);
  const next = { ...session, sets };
  const completed = progress(day, next).total > 0 && progress(day, next).done === progress(day, next).total;
  return { ...next, completed, burnEstimate: completed ? next.burnEstimate : undefined };
}
