# HARNESS.md — Supabase Auth & Commercial Foundation

## 0. Product Goal

Upgrade Gym Log from a browser-only MVP into a commercial-software foundation:

- users register and sign in with email and password
- training, nutrition and history data persist in Supabase
- each user can access only their own records
- data syncs across devices after sign-in
- existing LocalStorage users can optionally migrate their data once

This phase builds an authenticated personal training log. It does **not** add payments, subscriptions, social features, AI coaching, or an admin dashboard.

---

## 1. Required Stack

Use:

- existing Next.js App Router + TypeScript + Tailwind CSS
- Supabase Auth
- Supabase Postgres database
- `@supabase/ssr` for browser/server Supabase clients
- `@supabase/supabase-js`
- email + password authentication

Do not use a separate custom backend, Prisma, Firebase, Clerk, NextAuth, or a second database.

---

## 2. Environment Variables

Create `.env.local` locally only; it must never be committed.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Never expose:

- Supabase service-role key
- database password
- any secret API key in a `NEXT_PUBLIC_*` variable

Add a checked-in `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

For Vercel, configure the same public variables in Production, Preview, and Development environments.

---

## 3. Authentication User Flow

### 3.1 Routes

Create:

```txt
app/
  login/page.tsx
  signup/page.tsx
  auth/callback/route.ts
```

### 3.2 Sign up

`/signup` fields:

```txt
Email
Password
Confirm password
[ Create account ]
Already have an account? Sign in
```

Rules:

- validate valid email format
- require password at least 8 characters
- require confirmation match
- use `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`
- show a clear “check your email to confirm your account” state when confirmation is enabled
- never reveal whether another person owns an email address beyond Supabase’s safe default response

### 3.3 Sign in

`/login` fields:

```txt
Email
Password
[ Sign in ]
[ Forgot password ]
No account? Create one
```

Use `supabase.auth.signInWithPassword`.

After success, redirect to `/`.

### 3.4 Session handling

- Use Supabase SSR cookie/session helpers.
- Add `middleware.ts` to refresh the auth session.
- Protect `/`, `/plan`, `/history`, `/nutrition`, and `/nutrition/settings`.
- Unauthenticated users opening a protected route must redirect to `/login?next=<path>`.
- Add a visible sign-out button in `AppShell` or a compact account menu.
- Sign-out calls `supabase.auth.signOut()` and redirects to `/login`.

### 3.5 Password reset

Add a basic forgot-password form and reset route only if Supabase email templates/redirect URLs are configured. Otherwise, leave a clearly marked follow-up task; do not fake the feature.

---

## 4. Database Schema

Use SQL migrations in:

```txt
supabase/migrations/
```

All tables require:

- UUID primary key
- `user_id uuid not null references auth.users(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` where records are editable

Add a reusable update-time trigger for every editable table:

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply this trigger to workout_plans, workout_days, exercises,
-- workout_sessions, completed_sets, nutrition_profiles,
-- nutrition_days, meal_entries, and profiles.
```

### 4.1 `profiles`

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Create a Supabase trigger that inserts an empty profile for every new auth user.

### 4.2 `workout_plans`

```sql
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_active_plan_per_user
on public.workout_plans (user_id)
where is_active = true;
```

### 4.3 `workout_days`

```sql
create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 4.4 `exercises`

```sql
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  name text not null,
  target_sets integer not null check (target_sets > 0),
  target_reps text not null,
  target_weight text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 4.5 `workout_sessions`

```sql
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  workout_day_id uuid not null references public.workout_days(id) on delete restrict,
  workout_day_name text not null,
  completed boolean not null default false,
  burn_estimate jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, session_date, workout_day_id)
);
```

Do not hard-delete a workout day that has completed sessions. Add an `archived_at timestamptz` column to `workout_days`; hide archived days from plan selection while retaining their IDs and historical session links.

`burn_estimate` shape:

```ts
{
  durationMinutes: number;
  effort: "easy" | "moderate" | "hard";
  sessionType: "upper" | "lower" | "full_body" | "accessory";
  lowCalories: number;
  highCalories: number;
  estimatedAt: string;
}
```

### 4.6 `completed_sets`

```sql
create table public.completed_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  set_index integer not null,
  done boolean not null default false,
  actual_reps text,
  actual_weight text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workout_session_id, exercise_id, set_index)
);
```

### 4.7 `nutrition_profiles`

```sql
create table public.nutrition_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gender text not null check (gender in ('male', 'female')),
  age integer not null check (age between 13 and 120),
  height_cm numeric not null check (height_cm > 0),
  weight_kg numeric not null check (weight_kg > 0),
  activity_level text not null,
  goal text not null check (goal in ('bulk', 'cut', 'maintain')),
  calorie_adjustment integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 4.8 `nutrition_days` and `meal_entries`

```sql
create table public.nutrition_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_date)
);

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nutrition_day_id uuid not null references public.nutrition_days(id) on delete cascade,
  name text not null,
  calories numeric not null check (calories >= 0),
  protein numeric not null default 0 check (protein >= 0),
  fat numeric not null default 0 check (fat >= 0),
  carbs numeric not null default 0 check (carbs >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 5. Row-Level Security (Mandatory)

Enable RLS on every public table.

Every user-owned table must have policies equivalent to:

```sql
alter table public.<table_name> enable row level security;

create policy "Users can read own rows"
on public.<table_name> for select
using (auth.uid() = user_id);

create policy "Users can insert own rows"
on public.<table_name> for insert
with check (auth.uid() = user_id);

create policy "Users can update own rows"
on public.<table_name> for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own rows"
on public.<table_name> for delete
using (auth.uid() = user_id);
```

For `profiles` and `nutrition_profiles`, use `auth.uid() = id` / `auth.uid() = user_id` as appropriate.

### 5.1 Parent ownership integrity (Mandatory)

RLS on a row’s own `user_id` is not sufficient for child foreign keys. A user must never be able to attach their child row to another user’s plan, workout day, session, or nutrition day.

Add `before insert or update` triggers that reject parent/child ownership mismatches for:

```txt
workout_days.plan_id                  -> workout_plans.user_id
exercises.workout_day_id              -> workout_days.user_id
workout_sessions.workout_day_id       -> workout_days.user_id
completed_sets.workout_session_id     -> workout_sessions.user_id
completed_sets.exercise_id            -> exercises.user_id
meal_entries.nutrition_day_id         -> nutrition_days.user_id
```

Each trigger must raise an exception when the parent record’s `user_id` does not equal `new.user_id`.

This check belongs in the database, not only in TypeScript repository code.

Requirements:

- never rely only on client-side filtering
- never use the service-role key in browser code
- test that User A cannot read or mutate User B data

---

## 6. Client and Data Access Layer

Create:

```txt
lib/supabase/
  client.ts
  server.ts
  middleware.ts
lib/repository/
  plans.ts
  sessions.ts
  nutrition.ts
```

Rules:

- UI components must not contain raw Supabase table queries beyond thin page/controller calls.
- Repository functions must be typed and scoped to the currently authenticated user.
- Use `upsert` for nutrition profile, daily nutrition records, sessions, and completed sets where appropriate.
- All mutations must show a recoverable error state.
- Use optimistic UI only when failed writes can be rolled back cleanly.

Replace current LocalStorage persistence for app data after sign-in:

```txt
gym-log-plan                  -> Supabase plan/day/exercise tables
gym-log-sessions              -> Supabase workout sessions/completed sets
gym-log-active-day            -> browser preference only, or user profile preference later
gym-log-nutrition-profile     -> Supabase nutrition_profiles
gym-log-nutrition-days        -> Supabase nutrition_days/meal_entries
```

`gym-log-active-day` may remain LocalStorage because it is a device UI preference, not essential user data.

---

## 7. Default Plan Provisioning

When a newly authenticated user has no active plan:

1. Create a user-owned `workout_plans` row.
2. Create the existing default five workout days.
3. Create the existing exercises with positions.
4. Mark the plan active.

Requirements:

- provisioning must be idempotent
- do not create a second default plan on every login
- use the user’s authenticated `user_id`

---

## 8. LocalStorage Migration

Do not silently upload existing browser data.

On first authenticated visit, if legacy LocalStorage data exists and no cloud data exists, show:

```txt
Import existing device data?

Your plans, workout history, and nutrition records are currently stored only in this browser.
[ Import to my account ] [ Start fresh ]
```

Rules:

- import only after explicit confirmation
- show a success/failure result
- retain LocalStorage until import succeeds
- after successful import, mark migration complete with a versioned local flag
- never overwrite cloud records without a user-visible conflict decision
- `Start fresh` provisions the default plan without uploading legacy records

Initial scope can support one-time import from the current LocalStorage schema only.

### 8.1 Legacy ID to UUID mapping

Current LocalStorage workout days and exercises use string IDs, while Supabase rows use UUIDs. The importer must:

1. Create the cloud plan and store `legacyPlanId -> cloudPlanUuid` in memory.
2. Create each workout day and store `legacyWorkoutDayId -> cloudWorkoutDayUuid`.
3. Create each exercise and store `legacyExerciseId -> cloudExerciseUuid`.
4. Create sessions using the mapped workout-day UUID.
5. Create completed sets using the mapped exercise UUID while preserving the exercise-name snapshot.
6. Commit the migration-complete flag only after all writes succeed.

If any mapped parent record cannot be created, stop the import and show a retryable error; do not mark migration complete.

---

## 9. UI Requirements

Keep the existing clean, monochrome, mobile-first style.

Add:

- account email and `Sign out` in navigation or compact menu
- sync status only when useful: `Saving…`, `Saved`, `Couldn’t save. Retry`
- empty loading skeleton/state while authenticated data loads
- clear auth and mutation errors without exposing technical details

Do not add a marketing landing page, billing page, social features, analytics dashboard, or complex profile screen.

---

## 10. Cross-Device Editing Requirements

After sign-in, the following data must be editable on phone, Mac, Windows, tablet, and any supported modern browser:

| Data | Editing location | Persistence rule |
| --- | --- | --- |
| Height | Nutrition settings | Save to `nutrition_profiles` immediately |
| Weight | Nutrition settings | Save to `nutrition_profiles` immediately |
| Age, sex, goal, activity level, calorie adjustment | Nutrition settings | Save to `nutrition_profiles` immediately |
| Workout day, exercise name, target sets/reps/weight, ordering | Plan editor | Save to plan tables immediately |
| Completed set, actual reps, actual weight | Today workout | Save to session/set rows immediately |
| Workout session type, duration, effort | Workout-complete estimate panel | Save to `workout_sessions.burn_estimate` immediately |
| Meals, calories, protein, fat, carbs | Nutrition page | Save to nutrition/meal tables immediately |

Requirements:

- A user may edit every listed field from any authenticated device.
- A successful save on phone must be visible after refresh or sign-in on Mac/Windows, and vice versa.
- The UI must never rely on a device-only LocalStorage value for user-owned health, workout, nutrition, or plan data after migration.
- Keep only nonessential display preferences, such as the currently selected workout-day picker, in LocalStorage.
- On a mutation, show `Saving…`; show `Saved` after database confirmation; show `Couldn’t save. Retry` on failure.
- Do not report a field as saved before Supabase confirms the write.
- When the same record is changed on two devices, use `updated_at` for last-write-wins in this initial version. Before overwriting a locally edited form with remote data, show a non-blocking `Updated on another device` notice and provide `Reload latest`.
- All edit controls must be touch-friendly: at least 44px interactive height where practical, large tap targets, and no hover-only interaction.
- Forms must use responsive single-column layouts on small screens and retain keyboard accessibility on desktop.

### 10.1 Mobile, Mac, and Windows verification

Test at minimum:

1. Sign in on phone/browser A and change weight.
2. Sign in on desktop/browser B and refresh Nutrition settings.
3. Confirm the changed weight is visible and recalculates targets.
4. On desktop/browser B, update workout duration and effort after completing a session.
5. On phone/browser A, open Nutrition and confirm the workout burn range updates.
6. Add a meal on one device and edit/delete it on another.
7. Verify all controls work with touch and keyboard input.

---

## 11. Supabase and Vercel Setup Checklist

1. Create a Supabase project.
2. Enable Email provider in Supabase Auth.
3. Configure Site URL:
   ```txt
   https://<production-domain>
   ```
4. Add redirect URLs for local development and production:
   ```txt
   http://localhost:3000/auth/callback
   https://<production-domain>/auth/callback
   ```
5. Run SQL migrations.
6. Add environment variables in Vercel.
7. Deploy.
8. Test sign-up, email confirmation, sign-in, sign-out, cross-device sync, and RLS isolation.

---

## 12. Non-goals

Do not build in this phase:

- paid subscriptions or Stripe
- teams / shared plans
- public profiles
- social feed or workout sharing
- AI food recognition
- admin dashboard
- native mobile app
- OAuth providers beyond email/password
- data export/import beyond the one-time LocalStorage migration

Account deletion and self-service data deletion are not implemented in this initial UI, but the schema must retain cascade deletes from `auth.users` so a future account-deletion flow removes all user-owned data safely.

---

## 13. Acceptance Criteria

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] New users can sign up with email and password.
- [ ] Confirmed users can sign in and sign out.
- [ ] Protected pages redirect unauthenticated visitors to login.
- [ ] Each new user receives exactly one default plan.
- [ ] Plans, exercises, sessions, nutrition profile, and meals persist after refresh and across devices.
- [ ] Workout history is available on a second browser after sign-in.
- [ ] Nutrition data is available on a second browser after sign-in.
- [ ] Height, weight, nutrition settings, workout duration, effort, session type, meals, and workout data can be edited from phone and desktop browsers.
- [ ] An edit saved on one device is visible after refresh on a second signed-in device.
- [ ] Touch and keyboard editing work on supported mobile and desktop browsers.
- [ ] User A cannot read/write User B data under RLS.
- [ ] User A cannot attach a session, completed set, meal, exercise, or workout day to User B’s parent record.
- [ ] Each user has at most one active plan.
- [ ] Archived workout days remain visible in historical sessions and cannot be hard-deleted while referenced.
- [ ] `updated_at` changes on every supported edit.
- [ ] Legacy LocalStorage users see an explicit import-or-start-fresh choice.
- [ ] Legacy LocalStorage import maps old string IDs to cloud UUIDs before importing sessions and completed sets.
- [ ] No service-role key is exposed to the client.
- [ ] No database/auth/backend is added outside Supabase.
- [ ] Existing workout, nutrition, and burn-estimate behavior remains intact.
