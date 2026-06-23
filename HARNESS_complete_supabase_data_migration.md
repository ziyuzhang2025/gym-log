# HARNESS — Complete Supabase Data Migration

## Goal

Finish the Gym Log Supabase migration so that all user-owned data is read from and written to Supabase after sign-in. LocalStorage must no longer be the source of truth for plans, sessions, history, nutrition, or meals.

Existing foundation already available:

- Supabase Auth, middleware, login/signup/callback
- SQL migration and RLS
- `lib/supabase/*`
- `lib/repository/*`
- default plan provisioning
- home page initial cloud-plan/session write integration

## Required Work

### 1. Cloud repository completeness

Implement typed repository functions for:

```txt
plans: loadActivePlan, savePlan, archiveWorkoutDay
sessions: loadSessions, getOrCreateTodaySession, saveSessionWithSets
nutrition: loadNutritionProfile, saveNutritionProfile,
           loadNutritionDays, saveNutritionDay
```

All functions must:

- obtain the authenticated user
- surface recoverable errors
- use the existing Supabase RLS-protected tables
- never accept a caller-supplied user ID

### 2. Replace LocalStorage on every authenticated page

Update:

```txt
app/page.tsx
app/plan/page.tsx
app/history/page.tsx
app/nutrition/page.tsx
app/nutrition/settings/page.tsx
```

Requirements:

- `/` loads cloud plan and sessions; set edits persist immediately
- `/plan` loads/saves plans, days, exercises and positions in Supabase
- `/history` loads completed cloud sessions and completed-set counts
- `/nutrition` loads/saves nutrition profile, days and meals in Supabase
- `/nutrition/settings` edits the same cloud nutrition profile
- `gym-log-active-day` may remain LocalStorage as a device-only UI preference
- remove all other LocalStorage writes after successful migration

### 3. First-login migration

When authenticated cloud data is empty and legacy keys exist, show:

```txt
Import existing device data?
[ Import to my account ] [ Start fresh ]
```

Import rules:

1. Require explicit user click.
2. Create cloud plan/days/exercises first.
3. Build old string ID → cloud UUID maps.
4. Import sessions and completed sets through maps.
5. Import nutrition profile, days and meals.
6. Set `gym-log-cloud-migration-v1` only after all writes succeed.
7. Never delete legacy LocalStorage automatically.
8. On error, preserve legacy data and show Retry.

### 4. Sync UX

Every mutation shows one of:

```txt
Saving…
Saved
Couldn’t save. Retry
```

Rules:

- only show Saved after Supabase confirms
- failed optimistic edits roll back or show a retryable error
- use `updated_at` last-write-wins
- when a visible record is newer remotely, show `Updated on another device · Reload latest`

### 5. Mobile and desktop

All edit controls must work on iPhone/Android touch and Mac/Windows keyboard:

- minimum practical 44px tap targets
- no hover-only controls
- single-column forms on narrow widths
- accessible labels for all inputs

### 6. Security checks

- no service-role key in source, env example, browser, Git, or logs
- browser uses only URL + anon/publishable key
- RLS prevents user A from reading/writing user B data
- repositories never bypass authenticated user checks

### 7. Verification

Run:

```bash
npm run typecheck
npm run build
```

Manually verify:

1. Sign up and confirm email.
2. Sign in on browser A; default plan provisions once.
3. Edit height/weight and add a meal on browser A.
4. Sign in on browser B; refresh and verify both changes.
5. Complete a set and save workout duration/type; verify browser B sees it.
6. Verify History displays completed cloud sessions.
7. Test second account cannot access first account rows.
8. Test legacy LocalStorage import choice.

### 8. Deployment

1. Ensure Vercel has:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

in Production, Preview and Development.

2. Push only Supabase migration-related changes to `main`.
3. Wait for Vercel production success.
4. Verify signup, login and cloud data on production.

## Acceptance Criteria

- [ ] No authenticated user-owned data relies solely on LocalStorage.
- [ ] Plan, workout, history, nutrition and meals sync after sign-in across devices.
- [ ] Legacy import is explicit, safe and id-mapped.
- [ ] All save states are visible and recoverable.
- [ ] RLS isolation passes with two accounts.
- [ ] Typecheck and production build pass.
- [ ] Production deployment works with Supabase Auth.
