"use client";

import { useState } from "react";
import type { MealEntry } from "@/lib/types";

const blank = { name: "", calories: 0, protein: 0, fat: 0, carbs: 0 };
export function MealForm({ meal, onSave, onCancel }: { meal?: MealEntry; onSave: (meal: Omit<MealEntry, "id">) => void; onCancel: () => void }) {
  const [value, setValue] = useState<Omit<MealEntry, "id">>(meal ?? blank);
  const setNumber = (key: "calories" | "protein" | "fat" | "carbs", next: string) => setValue((current) => ({ ...current, [key]: Math.max(0, Number(next) || 0) }));
  return <form className="meal-form" onSubmit={(event) => { event.preventDefault(); if (value.name.trim()) onSave({ ...value, name: value.name.trim() }); }}><input className="field" value={value.name} onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))} placeholder="Meal name" aria-label="Meal name" required /><div className="meal-fields"><label>kcal<input className="field" type="number" min="0" value={value.calories} onChange={(event) => setNumber("calories", event.target.value)} /></label><label>Protein<input className="field" type="number" min="0" value={value.protein} onChange={(event) => setNumber("protein", event.target.value)} /></label><label>Fat<input className="field" type="number" min="0" value={value.fat} onChange={(event) => setNumber("fat", event.target.value)} /></label><label>Carbs<input className="field" type="number" min="0" value={value.carbs} onChange={(event) => setNumber("carbs", event.target.value)} /></label></div><div style={{ display: "flex", gap: 8, marginTop: 12 }}><button className="button small" type="submit">Save meal</button><button className="button secondary small" type="button" onClick={onCancel}>Cancel</button></div></form>;
}
