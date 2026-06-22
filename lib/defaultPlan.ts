import type { WorkoutPlan } from "./types";

export const defaultPlan: WorkoutPlan = { id: "default-plan", name: "Back Lower Back Lower Chest", days: [
  { id: "back-a", name: "Back A", exercises: [
    { id: "lat-pulldown", name: "Lat Pulldown", targetSets: 4, targetReps: "12-15" }, { id: "chest-supported-row", name: "Chest-supported Row", targetSets: 4, targetReps: "12-15" }, { id: "single-arm-low-row", name: "Single-arm Low Row", targetSets: 3, targetReps: "12-15" }, { id: "face-pull", name: "Face Pull", targetSets: 3, targetReps: "15-20" }, { id: "rear-delt-fly", name: "Rear Delt Fly", targetSets: 3, targetReps: "15-20" }, { id: "hammer-curl", name: "Hammer Curl", targetSets: 2, targetReps: "15" }
  ] },
  { id: "lower-a", name: "Lower A", exercises: [
    { id: "goblet-squat", name: "Goblet Squat / Light Squat", targetSets: 4, targetReps: "12" }, { id: "rdl", name: "Romanian Deadlift", targetSets: 4, targetReps: "12" }, { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", targetSets: 3, targetReps: "12 each" }, { id: "leg-curl", name: "Leg Curl", targetSets: 3, targetReps: "15" }, { id: "calf-raise", name: "Calf Raise", targetSets: 4, targetReps: "15-20" }, { id: "pallof-press", name: "Pallof Press", targetSets: 3, targetReps: "15" }
  ] },
  { id: "back-b", name: "Back B", exercises: [
    { id: "neutral-pulldown", name: "Neutral Grip Pulldown", targetSets: 4, targetReps: "12" }, { id: "seated-cable-row", name: "Seated Cable Row", targetSets: 4, targetReps: "12" }, { id: "straight-arm-pulldown", name: "Straight-arm Pulldown", targetSets: 3, targetReps: "15" }, { id: "face-pull-b", name: "Face Pull", targetSets: 3, targetReps: "15-20" }, { id: "reverse-pec-deck", name: "Reverse Pec Deck", targetSets: 3, targetReps: "15-20" }, { id: "ez-curl", name: "EZ Curl", targetSets: 2, targetReps: "15" }
  ] },
  { id: "lower-b", name: "Lower B", exercises: [
    { id: "light-trap-bar-deadlift", name: "Light Trap Bar Deadlift", targetSets: 3, targetReps: "10" }, { id: "leg-press", name: "Leg Press", targetSets: 4, targetReps: "15" }, { id: "walking-lunge", name: "Walking Lunge", targetSets: 3, targetReps: "12 each" }, { id: "leg-curl-b", name: "Leg Curl", targetSets: 3, targetReps: "15" }, { id: "leg-extension", name: "Leg Extension", targetSets: 3, targetReps: "15" }, { id: "seated-calf-raise", name: "Seated Calf Raise", targetSets: 4, targetReps: "20" }
  ] },
  { id: "chest", name: "Chest", exercises: [
    { id: "bench-press", name: "Bench Press", targetSets: 4, targetReps: "10-12" }, { id: "incline-db-press", name: "Incline Dumbbell Press", targetSets: 4, targetReps: "10-12" }, { id: "cable-fly", name: "Cable Fly", targetSets: 3, targetReps: "15" }, { id: "lateral-raise", name: "Lateral Raise", targetSets: 4, targetReps: "15-20" }, { id: "rope-pushdown", name: "Rope Pushdown", targetSets: 3, targetReps: "15" }
  ] }
] };
