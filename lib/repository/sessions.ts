import { createClient } from "@/lib/supabase/client";
import type { WorkoutSession } from "@/lib/types";

export async function saveWorkoutSession(session: WorkoutSession, cloudWorkoutDayId: string) { const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Not signed in"); const { data, error } = await supabase.from("workout_sessions").upsert({ user_id: user.id, session_date: session.date, workout_day_id: cloudWorkoutDayId, workout_day_name: session.workoutDayName, completed: session.completed, burn_estimate: session.burnEstimate ?? null }, { onConflict: "user_id,session_date,workout_day_id" }).select("id").single(); if (error) throw error; return data.id; }
