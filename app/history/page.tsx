"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { loadSessions } from "@/lib/storage";
import type { WorkoutSession } from "@/lib/types";

export default function HistoryPage() { const [sessions, setSessions] = useState<WorkoutSession[] | null>(null); useEffect(() => setSessions(loadSessions().filter((session) => session.completed).sort((a, b) => b.date.localeCompare(a.date))), []); return <AppShell><h1 className="page-title">History</h1><p className="muted" style={{ margin: "8px 0 24px" }}>Completed workouts.</p>{sessions === null ? <p className="muted">Loading history…</p> : sessions.length === 0 ? <p className="muted">No completed workouts yet.</p> : <div>{sessions.map((session) => <article className="history-item" key={session.id}><strong>{session.workoutDayName}</strong><div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{session.date} · Complete · {session.sets.filter((set) => set.done).length} sets</div></article>)}</div>}</AppShell>; }
