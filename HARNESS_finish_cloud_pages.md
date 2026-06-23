# HARNESS — Finish Remaining Supabase Cloud Pages

## Scope

Complete only these outstanding Supabase migrations:

1. `/plan` cloud loading and editing
2. `/history` cloud loading
3. `/nutrition` and `/nutrition/settings` cloud loading/editing
4. explicit first-login LocalStorage import and cross-device sync status

Existing Supabase Auth, RLS, database migration, default-plan provisioning, and basic repositories must be reused.

## 1. `/plan` Cloud Editing

Replace `loadPlan` / `savePlan` LocalStorage calls with repository functions.

Required repository API:

```ts
loadActivePlan(): Promise<WorkoutPlan | null>
savePlan(plan: WorkoutPlan): Promise<WorkoutPlan>
archiveWorkoutDay(dayId: string): Promise<void>
```

Rules:

- Load active plan, days, and exercises from Supabase.
- Persist exercise name, sets, reps, weight, day name, additions, deletion/archive, and order immediately.
- Preserve cloud UUIDs in `WorkoutPlan`, `WorkoutDay`, and `Exercise` IDs.
- Use `position` columns for ordering.
- Do not hard-delete workout days referenced by sessions; archive them.
- UI shows `Saving…`, `Saved`, or `Couldn’t save. Retry`.

## 2. `/history` Cloud Loading

Required repository API:

```ts
loadCompletedSessions(): Promise<WorkoutSession[]>
```

Rules:

- Query `workout_sessions` where `completed = true`, newest date first.
- Include related `completed_sets` so each history row shows completed set count.
- Show workout day name, date, completion status, and total completed sets.
- No LocalStorage session reads.
- Empty state: `No completed workouts yet.`

## 3. Nutrition Cloud Data

Required repository API:

```ts
loadNutritionProfile(): Promise<NutritionProfile | null>
saveNutritionProfile(profile: NutritionProfile): Promise<void>
loadNutritionDays(): Promise<NutritionDay[]>
saveNutritionDay(day: NutritionDay): Promise<void>
```

Rules:

- `/nutrition` loads profile, nutrition days, active plan/session from Supabase.
- `/nutrition/settings` loads and saves the same Supabase nutrition profile.
- Add/edit/delete meals persists to `nutrition_days` and `meal_entries`.
- Preserve meal UUIDs after loading.
- Existing calculated calorie, macro, base burn, and workout range UI remains unchanged.
- No `gym-log-nutrition-profile` or `gym-log-nutrition-days` reads/writes after successful migration.

## 4. First-Login LocalStorage Import

Show only when:

- user is authenticated
- `gym-log-cloud-migration-v1` is absent
- legacy LocalStorage data exists
- cloud account has no active plan and no nutrition/session data

Dialog:

```txt
Import existing device data?
Your plans, history and nutrition are stored only in this browser.
[ Import to my account ] [ Start fresh ]
```

Import order:

1. Read legacy plan, sessions, nutrition profile, and nutrition days.
2. Create cloud plan/days/exercises.
3. Build old plan/day/exercise string ID → new UUID maps.
4. Import sessions using mapped workout day UUIDs.
5. Import completed sets using mapped exercise UUIDs.
6. Import nutrition profile, days, and meals.
7. Set `gym-log-cloud-migration-v1 = complete` only after all requests succeed.

Failure rules:

- retain LocalStorage data
- do not mark migration complete
- show `Import failed. Retry.`
- never silently overwrite cloud data

`Start fresh` provisions the default cloud plan and sets the completed flag without uploading legacy data.

## 5. Cross-Device Sync Status

Create a small reusable mutation-state component/hook:

```ts
type SaveState = "idle" | "saving" | "saved" | "error";
```

Display:

```txt
Saving…
Saved
Couldn’t save. Retry
```

Rules:

- show Saved only after Supabase resolves successfully
- failed writes retain a retry function
- use `updated_at` last-write-wins
- on page focus/refresh, reload cloud data
- if remote `updated_at` is newer than mounted data, show `Updated on another device · Reload latest`

## 6. Verification

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `/plan` edits persist after refresh and on second signed-in browser.
- [ ] `/history` shows cloud completed sessions.
- [ ] Nutrition profile and meals persist after refresh and on second browser.
- [ ] One-time LocalStorage import maps IDs correctly.
- [ ] Start fresh does not import local records.
- [ ] A failed database write shows retryable error.
- [ ] No user-owned data uses LocalStorage as its only persistence after migration.
- [ ] RLS still prevents cross-user reads/writes.
