import assert from "node:assert/strict";
import test from "node:test";
import {
  clampCurrentWeek,
  commitCurrentWeekInput,
  commitPositiveIntegerInput,
  defaultPeriodizationSettings,
  getCalendarAllowedWeek,
  getCompletedTrainingStats,
  getCurrentPhase,
  normalizePeriodizationSettings,
} from "../lib/periodization";
import type { WorkoutSession } from "../lib/types";

test("calendar allowed week starts at 1 and advances every 7 days", () => {
  assert.equal(getCalendarAllowedWeek("2026-06-01", new Date("2026-06-01T12:00:00")), 1);
  assert.equal(getCalendarAllowedWeek("2026-06-01", new Date("2026-06-15T12:00:00")), 3);
  assert.equal(getCalendarAllowedWeek("2026-06-01", new Date("2026-06-26T12:00:00")), 4);
});

test("calendar allowed week stays at 1 for invalid or future start dates", () => {
  assert.equal(getCalendarAllowedWeek("not-a-date", new Date("2026-06-26T12:00:00")), 1);
  assert.equal(getCalendarAllowedWeek("2026-07-01", new Date("2026-06-26T12:00:00")), 1);
});

test("current week is clamped by total weeks and calendar allowed week", () => {
  assert.equal(clampCurrentWeek(5, 12, 4), 4);
  assert.equal(clampCurrentWeek(0, 12, 4), 1);
  assert.equal(clampCurrentWeek(9, 2, 5), 2);
});

test("blank current week input keeps the previous saved week instead of becoming zero", () => {
  const result = commitCurrentWeekInput("", 3, 12, 6);

  assert.deepEqual(result, {
    week: 3,
    message: "Enter a week number between 1 and 6.",
  });
});

test("current week input reports when the calendar limit blocks a larger week", () => {
  const result = commitCurrentWeekInput("8", 3, 12, 4);

  assert.deepEqual(result, {
    week: 4,
    message: "Current week cannot exceed Week 4 today.",
  });
});

test("blank positive integer input keeps the previous value while showing validation", () => {
  const result = commitPositiveIntegerInput("", 12, { min: 1, max: 52, label: "Total weeks" });

  assert.deepEqual(result, {
    value: 12,
    message: "Total weeks must be between 1 and 52.",
  });
});

test("positive integer input clamps to configured bounds on commit", () => {
  const result = commitPositiveIntegerInput("99", 12, { min: 1, max: 24, label: "End week" });

  assert.deepEqual(result, {
    value: 24,
    message: "End week must be between 1 and 24.",
  });
});

test("current phase is selected by current week", () => {
  const phases = [
    { id: "p1", name: "Hypertrophy", startWeek: 1, endWeek: 4, focus: "Volume" },
    { id: "p2", name: "Strength", startWeek: 5, endWeek: 8, focus: "Load" },
  ];

  assert.equal(getCurrentPhase(phases, 6)?.name, "Strength");
  assert.equal(getCurrentPhase(phases, 9), null);
});

test("settings normalize invalid totals, weeks, and phase ranges", () => {
  const normalized = normalizePeriodizationSettings({
    ...defaultPeriodizationSettings,
    startDate: "2026-06-01",
    totalWeeks: 0,
    manualCurrentWeek: 10,
    phases: [{ id: "bad", name: "", startWeek: 3, endWeek: 1, focus: "" }],
  }, new Date("2026-06-26T12:00:00"));

  assert.equal(normalized.totalWeeks, 1);
  assert.equal(normalized.manualCurrentWeek, 1);
  assert.deepEqual(normalized.phases[0], {
    id: "bad",
    name: "Phase",
    startWeek: 1,
    endWeek: 1,
    focus: "No focus set yet.",
  });
});

test("completed training stats count completed sessions since the cycle start", () => {
  const sessions: WorkoutSession[] = [
    { id: "before", date: "2026-05-31", workoutDayId: "d1", workoutDayName: "Lower", completed: true, sets: [] },
    { id: "one", date: "2026-06-01", workoutDayId: "d1", workoutDayName: "Lower", completed: true, sets: [] },
    { id: "two", date: "2026-06-03", workoutDayId: "d2", workoutDayName: "Upper", completed: true, sets: [] },
    { id: "draft", date: "2026-06-04", workoutDayId: "d3", workoutDayName: "Push", completed: false, sets: [] },
    { id: "three", date: "2026-06-08", workoutDayId: "d1", workoutDayName: "Lower", completed: true, sets: [] },
  ];

  assert.deepEqual(getCompletedTrainingStats(sessions, "2026-06-01", 2), {
    completedTrainingDaysSinceStart: 3,
    estimatedCompletedWeeks: 1,
  });
});
