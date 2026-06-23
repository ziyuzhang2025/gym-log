"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { NutritionProfileForm } from "@/components/NutritionProfileForm";
import { loadNutritionProfile, saveNutritionProfile } from "@/lib/storage";
import type { NutritionProfile } from "@/lib/types";

export default function NutritionSettingsPage() { const [profile, setProfile] = useState<NutritionProfile | null>(null); useEffect(() => setProfile(loadNutritionProfile()), []); return <AppShell><Link className="muted" style={{ fontSize: 14 }} href="/nutrition">← Nutrition</Link><h1 className="page-title" style={{ marginTop: 18 }}>Nutrition targets</h1><p className="muted" style={{ margin: "8px 0 24px" }}>Changing these values updates today’s estimated targets, not your saved meals.</p><NutritionProfileForm key={JSON.stringify(profile)} profile={profile} onSave={(next) => { saveNutritionProfile(next); setProfile(next); }} /></AppShell>; }
