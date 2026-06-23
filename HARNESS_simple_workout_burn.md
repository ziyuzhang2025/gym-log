# HARNESS.md — Simple Workout Burn Estimate

## 0. Goal

Simplify the Gym Log workout-calorie feature so it is transparent and easy to use.

The workout plan is used only to determine whether today’s workout is complete. Workout calorie burn is estimated from:

- completed workout status
- total session duration
- user-selected effort

Do **not** use exercise names, sets, reps, lifted weight, bodyweight, estimated volume, or exercise categories to modify the calorie result.

The UI must clearly state that the estimate is based on session duration and effort.

---

## 1. User Flow

1. User completes every planned set in today’s workout.
2. The app marks the workout complete.
3. Only then show the session estimate form.
4. User enters total workout duration and effort.
5. App saves a calorie-burn range to today’s workout session.
6. Nutrition page shows base burn, workout range, and total daily-burn range.

The user can edit duration or effort later; the range recalculates immediately.

---

## 2. Required Inputs

```txt
Workout complete

Session duration (minutes) [ 60 ]
Effort                    [ Moderate v ]

[ Save workout estimate ]
```

Validation:

- `durationMinutes`: whole number from 10 to 240
- `effort`: `easy`, `moderate`, or `hard`

Do not require a user to enter actual reps or actual weight.

---

## 3. Simple Calculation

This is a product estimate, not a physiological measurement.

```ts
export type WorkoutEffort = "easy" | "moderate" | "hard";

const kcalPerMinute = {
  easy: 3.5,
  moderate: 4.8,
  hard: 6.0
};

centerCalories = durationMinutes * kcalPerMinute[effort];
spreadCalories = Math.max(25, centerCalories * 0.20);

lowCalories = Math.round(Math.max(50, centerCalories - spreadCalories));
highCalories = Math.round(Math.min(900, centerCalories + spreadCalories));
```

Guard rails:

- `lowCalories` and `highCalories` are always displayed as a range.
- Clamp both values to 50–900 kcal.
- Ensure `highCalories >= lowCalories`.
- Never display a single exact estimated workout calorie number.

Examples:

| Duration | Effort | Displayed range |
| --- | --- | --- |
| 45 min | Easy | about 126–189 kcal |
| 60 min | Moderate | about 230–346 kcal |
| 75 min | Hard | about 360–540 kcal |

---

## 4. Data Model

Keep the existing session-level model:

```ts
export type WorkoutBurnEstimate = {
  durationMinutes: number;
  effort: WorkoutEffort;
  lowCalories: number;
  highCalories: number;
  estimatedAt: string;
};

export type WorkoutSession = {
  // existing fields
  burnEstimate?: WorkoutBurnEstimate;
};
```

Persist the estimate in the existing LocalStorage workout sessions collection. Do not add a database, backend, or new external API.

---

## 5. Home Page

Show `WorkoutBurnForm` immediately below the workout progress section only when every planned set is marked complete.

Before saving:

```txt
Workout complete
Add your total session duration and effort to estimate a calorie range.
```

After saving:

```txt
Workout estimate: 230–346 kcal
Based on 60 minutes at moderate effort.
[ Edit estimate ]
```

Required disclaimer:

```txt
This range is estimated from session duration and effort, not a medical measurement.
```

---

## 6. Nutrition Page

The base daily burn must exclude the logged workout.

Before completion:

```txt
Base daily burn: 2,050 kcal
Today’s workout burn: Complete today’s workout to estimate
Estimated daily burn: —
```

After an estimate is saved:

```txt
Base daily burn: 2,050 kcal
Workout estimate: 230–346 kcal
Estimated daily burn: 2,280–2,396 kcal
```

```ts
totalDailyBurnLow = baseDailyBurn + workoutBurn.lowCalories;
totalDailyBurnHigh = baseDailyBurn + workoutBurn.highCalories;
```

Do not alter food intake totals, calorie targets, macro targets, or meals automatically.

---

## 7. Remove From the Existing Feature

Remove all workout-calorie use of:

- exercise categories
- compound vs. isolation factors
- completed volume / tonnage
- actual weight
- target weight
- actual reps
- target reps
- bodyweight load estimates
- workout-plan workload modifiers

`lib/workoutBurn.ts` should contain only the duration/effort range calculation.

---

## 8. Non-goals

Do not add:

- wearable or heart-rate integration
- external fitness APIs
- exact calorie claims
- per-exercise calorie estimates
- automatic meal adjustments
- database, authentication, or backend API

---

## 9. Acceptance Criteria

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Workout estimate form appears only after all planned sets are completed.
- [ ] User can save and edit duration and effort.
- [ ] Estimate uses only duration and effort.
- [ ] Estimate always displays a kcal range.
- [ ] Estimate persists after refresh.
- [ ] Nutrition page combines base burn and the saved range correctly.
- [ ] Unchecking a completed set removes the saved workout estimate.
- [ ] No workout-plan details affect workout-calorie output.
- [ ] No database, authentication, backend, or external API added.
