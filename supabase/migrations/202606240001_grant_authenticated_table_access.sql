-- RLS policies decide which rows an authenticated user may access.
-- These grants allow the authenticated PostgREST role to reach those policies.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.workout_plans,
  public.workout_days,
  public.exercises,
  public.workout_sessions,
  public.completed_sets,
  public.nutrition_profiles,
  public.nutrition_days,
  public.meal_entries
to authenticated;
