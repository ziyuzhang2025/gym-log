"use client";

import { useState } from "react";
import type { MealEntry } from "@/lib/types";
import { MealForm } from "./MealForm";

export function MealList({ meals, onAdd, onUpdate, onDelete }: { meals: MealEntry[]; onAdd: (meal: Omit<MealEntry, "id">) => void; onUpdate: (id: string, meal: Omit<MealEntry, "id">) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false); const [editing, setEditing] = useState<string | null>(null);
  return <section style={{ marginTop: 28 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><h2 style={{ margin: 0, fontSize: 18 }}>Today’s meals</h2>{!adding && <button className="button secondary small" onClick={() => setAdding(true)}>+ Add meal</button>}</div>{adding && <MealForm onSave={(meal) => { onAdd(meal); setAdding(false); }} onCancel={() => setAdding(false)} />}{meals.length === 0 && !adding ? <p className="muted">No meals recorded yet.</p> : meals.map((meal) => editing === meal.id ? <MealForm key={meal.id} meal={meal} onSave={(next) => { onUpdate(meal.id, next); setEditing(null); }} onCancel={() => setEditing(null)} /> : <article className="meal-row" key={meal.id}><div><strong>{meal.name}</strong><div className="muted" style={{ marginTop: 4, fontSize: 13 }}>P {meal.protein}g · F {meal.fat}g · C {meal.carbs}g</div></div><div style={{ textAlign: "right" }}><strong>{meal.calories} kcal</strong><div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 7 }}><button className="text-button" onClick={() => setEditing(meal.id)}>Edit</button><button className="text-button" onClick={() => onDelete(meal.id)}>Delete</button></div></div></article>)}</section>;
}
