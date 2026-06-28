"use client";

import { useState } from "react";
import type { MealEntry } from "@/lib/types";

const blank = { name: "", calories: 0, protein: 0, fat: 0, carbs: 0 };
const numberText = (value: number) => value === 0 ? "" : String(value);
const parseNonNegative = (value: string) => {
  const parsed = Number(value);
  if (!value.trim() || !Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

export function MealForm({ meal, onSave, onCancel }: { meal?: MealEntry; onSave: (meal: Omit<MealEntry, "id">) => void; onCancel: () => void }) {
  const initial = meal ?? blank;
  const [value, setValue] = useState({
    name: initial.name,
    calories: numberText(initial.calories),
    protein: numberText(initial.protein),
    fat: numberText(initial.fat),
    carbs: numberText(initial.carbs),
  });
  const setField = (key: keyof typeof value, next: string) => setValue((current) => ({ ...current, [key]: next }));
  const save = () => {
    const name = value.name.trim();
    if (!name) return;
    onSave({
      name,
      calories: parseNonNegative(value.calories),
      protein: parseNonNegative(value.protein),
      fat: parseNonNegative(value.fat),
      carbs: parseNonNegative(value.carbs),
    });
  };
  return <form className="meal-form" onSubmit={(event) => { event.preventDefault(); save(); }}><input className="field" value={value.name} onChange={(event) => setField("name", event.target.value)} placeholder="Meal name" aria-label="Meal name" required /><div className="meal-fields"><label>kcal<input className="field" type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={value.calories} onChange={(event) => setField("calories", event.target.value)} /></label><label>Protein<input className="field" type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={value.protein} onChange={(event) => setField("protein", event.target.value)} /></label><label>Fat<input className="field" type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={value.fat} onChange={(event) => setField("fat", event.target.value)} /></label><label>Carbs<input className="field" type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={value.carbs} onChange={(event) => setField("carbs", event.target.value)} /></label></div><div style={{ display: "flex", gap: 8, marginTop: 12 }}><button className="button small" type="submit">Save meal</button><button className="button secondary small" type="button" onClick={onCancel}>Cancel</button></div></form>;
}
