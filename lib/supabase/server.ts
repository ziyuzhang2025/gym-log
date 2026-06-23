import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

export async function createClient() {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl!, supabaseAnonKey!, { cookies: { getAll: () => cookieStore.getAll(), setAll: (items) => { try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Component cookie writes are handled by middleware. */ } } } });
}
