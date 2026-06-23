# HARNESS.md — Session-Type Workout Burn Estimate

## 0. Goal

Improve the simple workout-burn estimate by acknowledging that lower-body and full-body strength sessions usually demand more energy than upper-body or light accessory sessions.

The estimate remains transparent and range-based. It must use only:

- completed workout status
- total session duration
- self-selected effort
- session type

It must not use individual exercise weight, reps, volume, tonnage, or exercise-category calculations.

---

## 1. User Flow

1. User completes every planned set in today’s selected workout.
2. The app shows a workout-complete estimate form.
3. The form preselects a session type based on the selected workout day.
4. User can change that type, enter total duration, and select effort.
5. The app saves a kcal range into today’s workout session.
6. Nutrition displays base daily burn, the workout range, and total daily-burn range.

---

## 2. Session Types

Add:

```ts
export type WorkoutSessionType = "upper" | "lower" | "full_body" | "accessory";
```

Use these labels and factors:

| Value | Label | Factor |
| --- | --- | --- |
| `upper` | Upper body | 0.90 |
| `lower` | Lower body | 1.10 |
| `full_body` | Full body | 1.20 |
| `accessory` | Light / accessory work | 0.80 |

These are product-level modifiers for a range estimate, not physiological measurements.

### 2.1 Default selection

Infer only a default; never lock the user into it.

```ts
"Lower A" / "Lower B" => "lower"
"Back A" / "Back B" / "Chest" => "upper"
otherwise => "full_body"
```

The user must be able to choose any session type before saving.

---

## 3. Form

Show only after all planned sets are complete.

```txt
Workout complete

Session type              [ Lower body v ]
Session duration (minutes) [ 60 ]
Effort                    [ Moderate v ]

[ Save workout estimate ]
```

Validation:

- duration is an integer from 10 through 240
- session type is required
- effort is required

After save:

```txt
Workout estimate: 253–380 kcal
Based on 60 minutes, moderate effort, lower-body session.
[ Edit estimate ]
```

Required disclaimer:

```txt
This range is estimated from session duration, effort, and session type—not a medical measurement.
```

---

## 4. Data Model

```ts
export type WorkoutEffort = "easy" | "moderate" | "hard";
export type WorkoutSessionType = "upper" | "lower" | "full_body" | "accessory";

export type WorkoutBurnEstimate = {
  durationMinutes: number;
  effort: WorkoutEffort;
  sessionType: WorkoutSessionType;
  lowCalories: number;
  highCalories: number;
  estimatedAt: string;
};
```

Keep `burnEstimate` on the existing `WorkoutSession`, persisted through the existing LocalStorage sessions collection.

No database, backend, external API, wearable, or authentication feature is allowed.

---

## 5. Calculation

```ts
const kcalPerMinute = {
  easy: 3.5,
  moderate: 4.8,
  hard: 6.0
};

const sessionTypeFactor = {
  upper: 0.90,
  lower: 1.10,
  full_body: 1.20,
  accessory: 0.80
};

centerCalories =
  durationMinutes *
  kcalPerMinute[effort] *
  sessionTypeFactor[sessionType];

spreadCalories = Math.max(25, centerCalories * 0.20);

lowCalories = round(clamp(50, 900, centerCalories - spreadCalories));
highCalories = round(clamp(50, 900, centerCalories + spreadCalories));
```

Always ensure:

```ts
highCalories >= lowCalories;
```

Examples for 60 minutes at moderate effort:

| Session type | Range |
| --- | --- |
| Upper body | 207–311 kcal |
| Lower body | 253–380 kcal |
| Full body | 276–415 kcal |
| Light / accessory | 184–276 kcal |

---

## 6. Nutrition Integration

The nutrition profile’s activity multiplier continues to mean daily activity **outside this logged workout**.

```txt
Base daily burn: 2,050 kcal
Workout estimate: 253–380 kcal
Estimated daily burn: 2,303–2,430 kcal
```

```ts
totalBurnLow = baseDailyBurn + estimate.lowCalories;
totalBurnHigh = baseDailyBurn + estimate.highCalories;
```

Do not automatically change:

- food intake totals
- calorie target
- macro targets
- meal entries

Before a saved estimate:

```txt
Today’s workout burn: Complete today’s workout to estimate.
```

After completion but before estimate input:

```txt
Today’s workout is complete. Add duration, effort, and session type on Today.
```

---

## 7. Required Files

Modify:

```txt
lib/types.ts
lib/workoutBurn.ts
components/WorkoutBurnForm.tsx
app/page.tsx
components/CalorieSummary.tsx
app/nutrition/page.tsx
```

No new storage key is needed.

---

## 8. Remove / Do Not Add

Do not use or add:

- completed volume / tonnage
- actual reps or weight in calorie calculation
- target reps or weight in calorie calculation
- compound / isolation exercise categories
- bodyweight load calculations
- heart rate or device data
- external exercise/food APIs
- exact calorie claims

The workout plan determines completion and a default session type only.

---

## 9. Acceptance Criteria

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Form remains hidden until all planned sets are complete.
- [ ] Form includes editable session type, duration, and effort.
- [ ] Lower A / Lower B defaults to lower body.
- [ ] Back A / Back B / Chest defaults to upper body.
- [ ] User can override every default.
- [ ] Estimate uses only duration, effort, and session type.
- [ ] Output is always a kcal range.
- [ ] Range persists after refresh.
- [ ] Nutrition correctly adds the saved range to base daily burn.
- [ ] Removing completion from any set removes the saved estimate.
- [ ] No database, backend, authentication, or external API is added.
