import type { CompletedSet, Exercise } from "@/lib/types";
import { SetCheckbox } from "./SetCheckbox";

export function ExerciseCard({ exercise, sets, onSetChange }: { exercise: Exercise; sets: CompletedSet[]; onSetChange: (setIndex: number, change: Partial<CompletedSet>) => void }) {
  const completed = sets.length > 0 && sets.every((set) => set.done);
  return <section className="card" style={{ padding: 16, marginTop: 14 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}><div><h2 style={{ margin: 0, fontSize: 17 }} className={completed ? "exercise-complete" : ""}>{exercise.name}</h2><p className="muted" style={{ margin: "5px 0 0", fontSize: 13 }}>Target: {exercise.targetSets} sets × {exercise.targetReps} reps{exercise.targetWeight ? ` · ${exercise.targetWeight}` : ""}</p></div>{completed && <span className="muted" style={{ fontSize: 13 }}>Complete</span>}</div>{sets.map((set) => <SetCheckbox key={set.setIndex} set={set} onChange={(change) => onSetChange(set.setIndex, change)} />)}</section>;
}
