# HARNESS.md — Completed Workout Burn Estimate

## 0. Goal

Extend Gym Log so that, **only after today’s selected workout is fully completed**, the app estimates the energy used in that workout and shows an estimated total daily burn.

The estimate must be presented as a **range**, never as an exact calorie fact.

```txt
Base daily burn: 2,050 kcal
Completed workout estimate: 180–250 kcal
Estimated daily burn: 2,230–2,300 kcal
```

This feature must not change the user’s food intake records automatically.

---

## 1. Important Calculation Rule

The existing nutrition profile must distinguish:

- `baseDailyBurn`: daily burn excluding the logged strength-training session
- `workoutBurn`: estimate from a completed workout
- `totalDailyBurn`: `baseDailyBurn + workoutBurn`

Do **not** calculate TDEE using an activity multiplier that already assumes regular training and then add workout calories again. That double-counts training.

For this feature, profile activity options must represent non-training lifestyle activity:

| Value | Label | Multiplier |
| --- | --- | --- |
| sedentary | Mostly seated outside training | 1.20 |
| light | Light daily movement / walking | 1.30 |
| moderate | Active daily lifestyle | 1.45 |
| active | Physical work / very active lifestyle | 1.60 |

The BMR equation remains Mifflin–St Jeor.

```ts
male:   bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
female: bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161

baseDailyBurn = round(bmr * nonTrainingActivityMultiplier)
```

---

## 2. Why It Is a Range

Reps and lifted weight alone are insufficient for an accurate strength-training calorie calculation. Rest time, exercise category, movement distance, tempo, training effort, bodyweight movements, and session duration materially affect energy use.

Therefore:

- Never show a single exact workout kcal value.
- Never use the estimate as medical or dietary advice.
- Show a range with a short explanation.
- Only estimate after every planned set is checked off.

Required disclaimer:

```txt
Workout calories are an estimate based on your completed log, duration, and effort—not a medical measurement.
```

---

## 3. Required Inputs

After all sets in today’s active workout are complete, show a compact completion panel.

```txt
Workout complete

Session duration (minutes) [ 60 ]
Effort                    [ Moderate v ]

[ Save workout estimate ]
```

Required:

- `durationMinutes`: integer, 10–240
- `effort`: `easy` / `moderate` / `hard`

Optional:

- actual reps and actual weight continue using existing per-set fields
- missing actual reps/weight falls back to target reps / target weight where possible

Do not show the completion panel until the workout’s full planned set count has been checked off.

---

## 4. Data Model

Update `lib/types.ts`.

```ts
export type WorkoutEffort = "easy" | "moderate" | "hard";

export type WorkoutBurnEstimate = {
  durationMinutes: number;
  effort: WorkoutEffort;
  lowCalories: number;
  highCalories: number;
  estimatedAt: string;
};

export type WorkoutSession = {
  id: string;
  date: string;
  workoutDayId: string;
  workoutDayName: string;
  sets: CompletedSet[];
  completed: boolean;
  burnEstimate?: WorkoutBurnEstimate;
};
```

No database and no new LocalStorage key are required. The estimate belongs on the existing saved workout session.

---

## 5. Exercise Categories

Add a local category map in `lib/workoutBurn.ts`; no external exercise API.

```ts
export type ExerciseCategory = "compound" | "isolation" | "bodyweight";
```

Classify current default exercises:

- compound: squat, Romanian deadlift, trap-bar deadlift, leg press, Bulgarian split squat, walking lunge, bench press, incline dumbbell press, pulldown, row
- isolation: curls, face pulls, flyes, leg curl, calf raise, leg extension, lateral raise, pushdown, Pallof press
- bodyweight: future bodyweight-only exercises

Unknown/custom exercises default to `isolation`.

---

## 6. Calculation Model

This is a product heuristic, not a physiological measurement.

### 6.1 Completed volume score

For each completed set:

```ts
effectiveReps = parse actualReps if valid, else midpoint of targetReps if numeric, else 10
effectiveWeightKg = parse actualWeight if valid, else parse targetWeight if numeric, else 0

// Bodyweight sets use a bodyweight fraction rather than 0 kg.
bodyweightLoadKg = profile.weightKg * 0.55
loadKg = category === "bodyweight" ? bodyweightLoadKg : effectiveWeightKg

volumeKg = loadKg * effectiveReps
```

Parsing rules:

- `"12-15"` midpoint is `13.5`
- `"12 each"` is `24` total reps for bilateral movement
- invalid/missing text falls back to 10 reps
- strings such as `"20 kg"` must parse to 20

### 6.2 Session factors

```ts
effortFactor = {
  easy: 0.85,
  moderate: 1.0,
  hard: 1.18
}

categoryFactor = {
  compound: 1.15,
  isolation: 0.85,
  bodyweight: 1.0
}
```

Calculate an average category factor across completed sets, weighted by set count.

### 6.3 Workout estimate

Use duration as the primary stabilizer and completed workload as a limited modifier.

```ts
baseKcalPerMinute = {
  easy: 3.5,
  moderate: 4.8,
  hard: 6.0
}

durationEstimate = durationMinutes * baseKcalPerMinute[effort]

// Prevent extreme load entries from dominating the estimate.
volumeModifier = clamp(
  0.85,
  1.20,
  0.90 + Math.min(totalCompletedVolumeKg / (profile.weightKg * 900), 0.20)
)

center = durationEstimate * averageCategoryFactor * volumeModifier
spread = max(25, center * 0.16)

lowCalories = round(max(0, center - spread))
highCalories = round(center + spread)
```

Guard rails:

- Clamp session range to `50–900 kcal`.
- `highCalories` must be greater than or equal to `lowCalories`.
- The model must only use sets marked `done`.
- Editing the workout duration or effort recomputes and immediately persists the range.

---

## 7. Nutrition Page Changes

On `/nutrition`, if a profile exists:

### Before workout completion

```txt
Base daily burn: 2,050 kcal
Today’s workout burn: Complete today’s workout to estimate
Estimated daily burn: —
```

### After workout completion, before duration/effort saved

```txt
Base daily burn: 2,050 kcal
Today’s workout is complete
[ Add session duration and effort ]
```

### After estimate is saved

```txt
Base daily burn: 2,050 kcal
Completed workout estimate: 180–250 kcal
Estimated daily burn: 2,230–2,300 kcal
```

Use the midpoint of the workout range only when calculating an optional `net intake` display. Do not replace the existing food intake total.

Optional net intake line:

```txt
Net intake after estimated workout: 1,715–1,785 kcal
```

This optional line must be labeled clearly as an estimate.

---

## 8. Home Page Changes

On `/`, show the completion panel directly below the progress bar only when all planned sets are complete.

Create:

```txt
components/
  WorkoutBurnForm.tsx
```

It must:

- accept duration and effort
- validate duration range
- save the `burnEstimate` into today’s active session immediately
- allow editing an existing saved estimate
- show the estimated range after saving

Do not force users to add an estimate before their session is considered complete.

---

## 9. Files

Create:

```txt
components/WorkoutBurnForm.tsx
lib/workoutBurn.ts
```

Modify:

```txt
lib/types.ts
lib/workout.ts
app/page.tsx
app/nutrition/page.tsx
components/CalorieSummary.tsx
app/globals.css
```

Keep LocalStorage-only persistence through the existing sessions key.

---

## 10. Non-goals

Do not implement:

- wearable-device integration
- heart-rate integration
- exact kcal claims
- automatic food-calorie changes
- database, login, backend or API
- exercise videos, exercise databases or machine-specific load conversion
- post-exercise calorie compensation rules

---

## 11. Acceptance Criteria

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Base daily burn uses the non-training activity multiplier.
- [ ] Workout burn is unavailable until all planned sets are marked complete.
- [ ] User can enter duration and easy/moderate/hard effort after completion.
- [ ] Estimate uses completed sets, recorded reps/weight where available, duration, effort, and exercise category.
- [ ] Estimate is displayed only as a kcal range.
- [ ] Range persists after page refresh.
- [ ] Nutrition page displays base burn, workout estimate and total daily-burn range correctly.
- [ ] Editing duration or effort updates the estimate.
- [ ] Existing food logging, plan editing, workout history and LocalStorage persistence continue working.
- [ ] No database, authentication, backend or external food/exercise API added.
