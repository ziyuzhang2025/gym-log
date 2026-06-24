# Gym Log

Gym Log is a simple, responsive training and nutrition companion. Build a workout plan, log completed sets with actual reps and weight, review training history, estimate a completed session's energy expenditure, and track meals and macros for the day.

**Live app:** [gym-log-ochre.vercel.app](https://gym-log-ochre.vercel.app)

## Features

- Email sign-up, email confirmation, sign-in, and sign-out with Supabase Auth.
- Workout plans with editable training days, exercises, target sets, reps, and weights.
- A Today’s Plan view for checking off completed sets and recording actual reps and weight.
- Training history for completed sessions.
- Optional post-workout calorie-burn estimate based on duration, effort, and session type (upper body, lower body, full body, or accessory work).
- Nutrition targets calculated from body details, non-training activity, and a bulk, cut, or maintenance goal.
- Daily meal entries with calories, protein, fat, and carbohydrates.
- Responsive layouts designed for phone, tablet, and desktop browsers.

> Calorie, macro, and workout-burn figures are estimates only. They are not medical advice.

## Tech stack

- [Next.js](https://nextjs.org/) 15 with the App Router
- React 19 and TypeScript
- Tailwind CSS
- [Supabase](https://supabase.com/) for authentication, Postgres, and Row Level Security
- [Vercel](https://vercel.com/) for production hosting

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project (required for the authenticated experience)

### Install and run

```bash
git clone https://github.com/ziyuzhang2025/gym-log.git
cd gym-log
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Add the following values to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

These are public browser configuration values. Never add a Supabase `service_role` key to this project, a client environment variable, Git, or Vercel logs.

## Supabase setup

1. Create a new Supabase project.
2. In **Authentication → URL Configuration**, set your application’s Site URL and add these redirect URLs:

   ```text
   http://localhost:3000/auth/callback
   https://YOUR_VERCEL_DOMAIN/auth/callback
   ```

3. In the Supabase SQL Editor, run [`supabase/migrations/202606230001_commercial_foundation.sql`](supabase/migrations/202606230001_commercial_foundation.sql).
4. Copy the project URL and publishable/anon key into `.env.local`.
5. For production, add the same variables in Vercel for the Production, Preview, and Development environments.

The migration creates the user-scoped workout and nutrition tables, `updated_at` triggers, ownership checks, and Row Level Security policies. Users can access only their own rows.

## Useful commands

```bash
# Start local development
npm run dev

# Type-check without emitting files
npm run typecheck

# Create a production build
npm run build

# Run the production server after building
npm run start
```

## Project structure

```text
app/                         Routes: workouts, plan, history, nutrition, auth
components/                  Reusable interface components
lib/                         Types, calculations, storage, Supabase clients, repositories
supabase/migrations/         Database schema, RLS policies, and triggers
middleware.ts                Supabase session refresh and protected-route handling
```

## Data and sync status

Supabase Auth, the initial workout plan load, workout-session writes, and completed-session history are connected to the cloud foundation.

The migration of every editing surface is still in progress. In the current build, the Plan editor and Nutrition pages retain browser LocalStorage behavior, so that data is not yet a complete cross-device sync solution. The intended next milestone is to finish cloud reads/writes for plans and nutrition, add explicit one-time import of existing device data, and show save/conflict status.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel and keep the default Next.js framework settings.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
4. Deploy.
5. Add the final Vercel URL to Supabase Auth URL Configuration as described above.

## Privacy

Workout and nutrition data are personal data. Use strong Supabase Row Level Security policies, keep privileged server keys out of the browser, and review your privacy obligations before using this as a commercial product.

## License

This repository does not currently include a license. All rights are reserved until a license is added.
