import type { CompletedSet } from "@/lib/types";

export function SetCheckbox({ set, onChange }: { set: CompletedSet; onChange: (change: Partial<CompletedSet>) => void }) {
  return <label className="set-row"><input className="checkbox" type="checkbox" checked={set.done} onChange={(event) => onChange({ done: event.target.checked })} aria-label={`Complete set ${set.setIndex + 1}`} /><span>Set {set.setIndex + 1}</span><input type="text" value={set.actualReps ?? ""} onChange={(event) => onChange({ actualReps: event.target.value })} placeholder="reps" aria-label={`Actual reps for set ${set.setIndex + 1}`} /><input type="text" value={set.actualWeight ?? ""} onChange={(event) => onChange({ actualWeight: event.target.value })} placeholder="weight" aria-label={`Actual weight for set ${set.setIndex + 1}`} /></label>;
}
