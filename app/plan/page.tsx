"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PlanEditor } from "@/components/PlanEditor";
import { defaultPlan } from "@/lib/defaultPlan";
import { loadPlan, savePlan } from "@/lib/storage";
import type { WorkoutPlan } from "@/lib/types";

export default function PlanPage() { const [plan, setPlan] = useState<WorkoutPlan | null>(null); useEffect(() => { const value = loadPlan() ?? defaultPlan; setPlan(value); if (!loadPlan()) savePlan(value); }, []); const change = (next: WorkoutPlan) => { setPlan(next); savePlan(next); }; return <AppShell><h1 className="page-title">Edit Plan</h1><p className="muted" style={{ margin: "8px 0 24px" }}>Changes save automatically.</p>{plan ? <PlanEditor plan={plan} onChange={change} /> : <p className="muted">Loading plan…</p>}</AppShell>; }
