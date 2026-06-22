export type WorkoutPlan = { id: string; name: string; days: WorkoutDay[] };
export type WorkoutDay = { id: string; name: string; exercises: Exercise[] };
export type Exercise = { id: string; name: string; targetSets: number; targetReps: string; targetWeight?: string };
export type WorkoutSession = { id: string; date: string; workoutDayId: string; workoutDayName: string; sets: CompletedSet[]; completed: boolean };
export type CompletedSet = { exerciseId: string; setIndex: number; done: boolean; actualReps?: string; actualWeight?: string };
