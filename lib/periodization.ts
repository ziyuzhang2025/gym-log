import type { WorkoutSession } from "./types";

export type TrainingPhaseName =
  | "Recovery"
  | "Muscle Endurance"
  | "Hypertrophy"
  | "Strength"
  | "Power"
  | "Deload";

export type PeriodizationPhase = {
  id: string;
  name: TrainingPhaseName | string;
  startWeek: number;
  endWeek: number;
  focus: string;
};

export type PeriodizationSettings = {
  cycleName: string;
  startDate: string;
  totalWeeks: number;
  manualCurrentWeek: number;
  phases: PeriodizationPhase[];
  updatedAt: string;
};

const todayString = () => new Date().toISOString().slice(0, 10);
const nowString = () => new Date().toISOString();

export const defaultPeriodizationSettings: PeriodizationSettings = {
  cycleName: "Elbow-safe Muscle Endurance Block",
  startDate: todayString(),
  totalWeeks: 3,
  manualCurrentWeek: 1,
  phases: [
    {
      id: "phase-1",
      name: "Muscle Endurance",
      startWeek: 1,
      endWeek: 3,
      focus:
        "Build work capacity, improve movement control, and protect the elbow before returning to heavier strength and power training.",
    },
  ],
  updatedAt: nowString(),
};

export function createDefaultPeriodizationSettings(): PeriodizationSettings {
  return {
    ...defaultPeriodizationSettings,
    startDate: todayString(),
    updatedAt: nowString(),
    phases: defaultPeriodizationSettings.phases.map((phase) => ({ ...phase })),
  };
}

export function getCalendarAllowedWeek(startDate: string, today = new Date()): number {
  const start = new Date(`${startDate}T00:00:00`);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (Number.isNaN(start.getTime())) return 1;
  if (current < start) return 1;

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((current.getTime() - start.getTime()) / msPerWeek) + 1;
}

export function clampCurrentWeek(
  requestedWeek: number,
  totalWeeks: number,
  calendarAllowedWeek: number
): number {
  const safeTotalWeeks = Math.max(1, Math.floor(totalWeeks) || 1);
  const safeAllowedWeek = Math.max(1, Math.min(Math.floor(calendarAllowedWeek) || 1, safeTotalWeeks));
  return Math.max(1, Math.min(Math.floor(requestedWeek) || 1, safeAllowedWeek));
}

export function commitCurrentWeekInput(
  input: string,
  previousWeek: number,
  totalWeeks: number,
  calendarAllowedWeek: number
) {
  const maxAllowedWeek = Math.max(1, Math.min(Math.floor(calendarAllowedWeek) || 1, Math.max(1, Math.floor(totalWeeks) || 1)));
  const parsedWeek = Number(input);

  if (!input.trim() || !Number.isFinite(parsedWeek)) {
    return {
      week: clampCurrentWeek(previousWeek, totalWeeks, calendarAllowedWeek),
      message: `Enter a week number between 1 and ${maxAllowedWeek}.`,
    };
  }

  const week = clampCurrentWeek(parsedWeek, totalWeeks, calendarAllowedWeek);
  return {
    week,
    message: week !== Math.floor(parsedWeek)
      ? `Current week cannot exceed Week ${maxAllowedWeek} today.`
      : "Saved.",
  };
}

export function commitPositiveIntegerInput(
  input: string,
  previousValue: number,
  options: { min: number; max: number; label: string }
) {
  const min = Math.max(1, Math.floor(options.min) || 1);
  const max = Math.max(min, Math.floor(options.max) || min);
  const parsedValue = Number(input);
  const message = `${options.label} must be between ${min} and ${max}.`;

  if (!input.trim() || !Number.isFinite(parsedValue)) {
    return {
      value: Math.max(min, Math.min(Math.floor(previousValue) || min, max)),
      message,
    };
  }

  const value = Math.max(min, Math.min(Math.floor(parsedValue), max));
  return {
    value,
    message: value !== Math.floor(parsedValue) ? message : "Saved.",
  };
}

export function getCurrentPhase(
  phases: PeriodizationPhase[],
  currentWeek: number
): PeriodizationPhase | null {
  return phases.find(
    (phase) => currentWeek >= phase.startWeek && currentWeek <= phase.endWeek
  ) ?? null;
}

export function normalizePeriodizationSettings(
  settings: PeriodizationSettings,
  today = new Date()
): PeriodizationSettings {
  const totalWeeks = Math.max(1, Math.floor(Number(settings.totalWeeks)) || 1);
  const calendarAllowedWeek = getCalendarAllowedWeek(settings.startDate, today);
  const phases = (settings.phases.length > 0 ? settings.phases : createDefaultPeriodizationSettings().phases)
    .map((phase, index) => {
      const startWeek = Math.max(1, Math.min(Math.floor(Number(phase.startWeek)) || 1, totalWeeks));
      const rawEndWeek = Math.floor(Number(phase.endWeek)) || startWeek;
      const endWeek = Math.max(startWeek, Math.min(rawEndWeek, totalWeeks));
      return {
        id: phase.id || `phase-${index + 1}`,
        name: phase.name.trim() || "Phase",
        startWeek,
        endWeek,
        focus: phase.focus.trim() || "No focus set yet.",
      };
    });

  return {
    ...settings,
    cycleName: settings.cycleName.trim() || "Training Cycle",
    startDate: settings.startDate || todayString(),
    totalWeeks,
    manualCurrentWeek: clampCurrentWeek(settings.manualCurrentWeek, totalWeeks, calendarAllowedWeek),
    phases,
    updatedAt: settings.updatedAt || nowString(),
  };
}

export function getCompletedTrainingStats(
  sessions: WorkoutSession[],
  startDate: string,
  plannedTrainingDaysPerWeek = 5
) {
  const safePlannedDays = Math.max(1, Math.floor(plannedTrainingDaysPerWeek) || 5);
  const completedTrainingDaysSinceStart = sessions.filter(
    (session) => session.completed && session.date >= startDate
  ).length;

  return {
    completedTrainingDaysSinceStart,
    estimatedCompletedWeeks: Math.floor(completedTrainingDaysSinceStart / safePlannedDays),
  };
}
