import Link from "next/link";
import type { WorkoutDay } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";

export function WorkoutHeader({ days, activeDayId, onDayChange, done, total, percent }: { days: WorkoutDay[]; activeDayId: string; onDayChange: (id: string) => void; done: number; total: number; percent: number }) {
  return <header><p className="muted" style={{ margin: "0 0 8px", fontSize: 14 }}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}><h1 className="page-title">Gym Log</h1><Link className="button secondary small" href="/plan">Edit Plan</Link></div><label className="muted" style={{ display: "block", marginTop: 28, fontSize: 13 }}>Today<select className="field" value={activeDayId} onChange={(event) => onDayChange(event.target.value)} style={{ marginTop: 5 }} aria-label="Select workout day">{days.map((day) => <option key={day.id} value={day.id}>{day.name}</option>)}</select></label><p style={{ margin: "22px 0 8px", fontSize: 14 }}>{done} / {total} sets completed</p><ProgressBar percent={percent} /></header>;
}
