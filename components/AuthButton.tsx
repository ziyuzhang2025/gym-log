"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@supabase/supabase-js";

export function AuthButton() { const [email, setEmail] = useState<string | null>(null); useEffect(() => { if (!isSupabaseConfigured) return; createClient().auth.getUser().then((result: { data: { user: User | null } }) => setEmail(result.data.user?.email ?? null)); }, []); if (!isSupabaseConfigured || !email) return null; return <button className="text-button" onClick={async () => { await createClient().auth.signOut(); window.location.assign("/login"); }}>{email} · Sign out</button>; }
