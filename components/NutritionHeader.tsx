import Link from "next/link";
import type { NutritionProfile } from "@/lib/types";

export function NutritionHeader({ profile }: { profile: NutritionProfile }) {
  const copy = profile.goal === "bulk" ? "Bulk · ~250 kcal surplus" : profile.goal === "cut" ? "Cut · ~400 kcal deficit" : "Maintain · maintenance calories";
  return <header style={{ marginBottom: 24 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}><div><h1 className="page-title">Nutrition</h1><p className="muted" style={{ margin: "7px 0 0", fontSize: 14 }}>{copy}</p></div><Link className="button secondary small" href="/nutrition/settings">Edit targets</Link></div></header>;
}
