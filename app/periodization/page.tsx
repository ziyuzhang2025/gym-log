"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  clampCurrentWeek,
  commitCurrentWeekInput,
  commitPositiveIntegerInput,
  createDefaultPeriodizationSettings,
  getCalendarAllowedWeek,
  getCompletedTrainingStats,
  getCurrentPhase,
  normalizePeriodizationSettings,
  type PeriodizationPhase,
  type PeriodizationSettings,
} from "@/lib/periodization";
import { loadPeriodizationSettings, loadSessions, savePeriodizationSettings } from "@/lib/storage";

const phaseOptions = ["Recovery", "Muscle Endurance", "Hypertrophy", "Strength", "Power", "Deload"];

function phaseId() {
  return `phase-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function PeriodizationPage() {
  const [settings, setSettings] = useState<PeriodizationSettings | null>(null);
  const [currentWeekDraft, setCurrentWeekDraft] = useState("");
  const [totalWeeksDraft, setTotalWeeksDraft] = useState("");
  const [phaseWeekDrafts, setPhaseWeekDrafts] = useState<Record<string, { startWeek: string; endWeek: string }>>({});
  const [message, setMessage] = useState("");
  const [completedStats, setCompletedStats] = useState({
    completedTrainingDaysSinceStart: 0,
    estimatedCompletedWeeks: 0,
  });

  useEffect(() => {
    const saved = loadPeriodizationSettings() ?? createDefaultPeriodizationSettings();
    const normalized = normalizePeriodizationSettings(saved);
    setSettings(normalized);
    syncNumberDrafts(normalized);
    savePeriodizationSettings(normalized);
    setCompletedStats(getCompletedTrainingStats(loadSessions(), normalized.startDate));
  }, []);

  const derived = useMemo(() => {
    if (!settings) return null;
    const calendarAllowedWeek = getCalendarAllowedWeek(settings.startDate);
    const currentWeek = clampCurrentWeek(settings.manualCurrentWeek, settings.totalWeeks, calendarAllowedWeek);
    return {
      calendarAllowedWeek,
      currentWeek,
      maxAllowedWeek: Math.min(settings.totalWeeks, calendarAllowedWeek),
      phase: getCurrentPhase(settings.phases, currentWeek),
    };
  }, [settings]);

  const updateSettings = (next: PeriodizationSettings, feedback = "Saved.") => {
    const normalized = normalizePeriodizationSettings({ ...next, updatedAt: new Date().toISOString() });
    setSettings(normalized);
    syncNumberDrafts(normalized);
    savePeriodizationSettings(normalized);
    setCompletedStats(getCompletedTrainingStats(loadSessions(), normalized.startDate));
    setMessage(feedback);
  };

  const syncNumberDrafts = (next: PeriodizationSettings) => {
    setCurrentWeekDraft(String(next.manualCurrentWeek));
    setTotalWeeksDraft(String(next.totalWeeks));
    setPhaseWeekDrafts(Object.fromEntries(
      next.phases.map((phase) => [
        phase.id,
        { startWeek: String(phase.startWeek), endWeek: String(phase.endWeek) },
      ])
    ));
  };

  const setField = <K extends keyof PeriodizationSettings>(field: K, value: PeriodizationSettings[K]) => {
    if (!settings) return;
    updateSettings({ ...settings, [field]: value });
  };

  const setManualWeek = (requestedWeek: number) => {
    if (!settings || !derived) return;
    const clamped = clampCurrentWeek(requestedWeek, settings.totalWeeks, derived.calendarAllowedWeek);
    updateSettings(
      { ...settings, manualCurrentWeek: clamped },
      clamped !== requestedWeek
        ? `Current week cannot exceed Week ${derived.maxAllowedWeek} today.`
        : "Saved."
    );
  };

  const commitManualWeekDraft = () => {
    if (!settings || !derived) return;
    const result = commitCurrentWeekInput(
      currentWeekDraft,
      derived.currentWeek,
      settings.totalWeeks,
      derived.calendarAllowedWeek
    );
    updateSettings({ ...settings, manualCurrentWeek: result.week }, result.message);
  };

  const commitTotalWeeksDraft = () => {
    if (!settings) return;
    const result = commitPositiveIntegerInput(totalWeeksDraft, settings.totalWeeks, {
      min: 1,
      max: 52,
      label: "Total weeks",
    });
    updateSettings({ ...settings, totalWeeks: result.value }, result.message);
  };

  const updatePhase = (phaseId: string, change: Partial<PeriodizationPhase>) => {
    if (!settings) return;
    updateSettings({
      ...settings,
      phases: settings.phases.map((phase) => phase.id === phaseId ? { ...phase, ...change } : phase),
    });
  };

  const setPhaseWeekDraft = (phaseId: string, field: "startWeek" | "endWeek", value: string) => {
    setPhaseWeekDrafts((previous) => ({
      ...previous,
      [phaseId]: {
        startWeek: previous[phaseId]?.startWeek ?? "",
        endWeek: previous[phaseId]?.endWeek ?? "",
        [field]: value,
      },
    }));
  };

  const commitPhaseWeekDraft = (phase: PeriodizationPhase, field: "startWeek" | "endWeek") => {
    if (!settings) return;
    const draft = phaseWeekDrafts[phase.id]?.[field] ?? String(phase[field]);
    const result = commitPositiveIntegerInput(draft, phase[field], {
      min: 1,
      max: settings.totalWeeks,
      label: field === "startWeek" ? "Start week" : "End week",
    });
    updatePhase(phase.id, { [field]: result.value });
    setMessage(result.message);
  };

  const addPhase = () => {
    if (!settings) return;
    const nextStart = Math.min(settings.totalWeeks, (settings.phases.at(-1)?.endWeek ?? 0) + 1);
    updateSettings({
      ...settings,
      phases: [
        ...settings.phases,
        {
          id: phaseId(),
          name: "Hypertrophy",
          startWeek: nextStart,
          endWeek: settings.totalWeeks,
          focus: "Describe the main training focus for this phase.",
        },
      ],
    });
  };

  const removePhase = (phaseId: string) => {
    if (!settings || settings.phases.length <= 1) return;
    updateSettings({ ...settings, phases: settings.phases.filter((phase) => phase.id !== phaseId) });
  };

  if (!settings || !derived) {
    return <AppShell><p className="muted">Loading periodization…</p></AppShell>;
  }

  return (
    <AppShell>
      <h1 className="page-title">Periodization</h1>
      <p className="muted" style={{ margin: "8px 0 24px" }}>
        Configure your training cycle and safely track the current week.
      </p>

      <section className="card periodization-card">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>Current Cycle</p>
        <h2 style={{ margin: "6px 0 6px", fontSize: 24 }}>{settings.cycleName}</h2>
        <p style={{ margin: "0 0 14px", fontSize: 18 }}>
          Week <strong>{derived.currentWeek}</strong> / {settings.totalWeeks}
        </p>
        <p style={{ margin: "8px 0" }}>
          Current Phase: <strong>{derived.phase?.name ?? "No phase for this week"}</strong>
        </p>
        {derived.phase && <p className="muted" style={{ margin: "8px 0 0" }}>{derived.phase.focus}</p>}
        <div className="periodization-summary">
          <span>Start date: <strong>{settings.startDate}</strong></span>
          <span>Maximum allowed current week today: <strong>Week {derived.maxAllowedWeek}</strong></span>
          <span>Completed training days this cycle: <strong>{completedStats.completedTrainingDaysSinceStart}</strong></span>
          <span>Estimated completed training weeks: <strong>{completedStats.estimatedCompletedWeeks}</strong></span>
        </div>
      </section>

      <section className="card periodization-card">
        <h2 style={{ marginTop: 0 }}>Settings</h2>
        <div className="periodization-grid">
          <label>
            Cycle name
            <input className="field" value={settings.cycleName} onChange={(event) => setField("cycleName", event.target.value)} />
          </label>
          <label>
            Start date
            <input className="field" type="date" value={settings.startDate} onChange={(event) => setField("startDate", event.target.value)} />
          </label>
          <label>
            Total weeks
            <input
              className="field"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              max="52"
              value={totalWeeksDraft}
              onChange={(event) => setTotalWeeksDraft(event.target.value)}
              onBlur={commitTotalWeeksDraft}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            />
          </label>
          <label>
            Current week
            <input
              className="field"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              max={derived.maxAllowedWeek}
              value={currentWeekDraft}
              onChange={(event) => setCurrentWeekDraft(event.target.value)}
              onBlur={commitManualWeekDraft}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            />
          </label>
        </div>
        <div className="week-adjust">
          <button
            className="button secondary small"
            onClick={() => setManualWeek(derived.currentWeek - 1)}
            disabled={derived.currentWeek <= 1}
          >
            − Week
          </button>
          <button
            className="button secondary small"
            onClick={() => setManualWeek(derived.currentWeek + 1)}
            disabled={derived.currentWeek >= derived.maxAllowedWeek}
          >
            + Week
          </button>
          <span className="muted">Allowed range: Week 1–{derived.maxAllowedWeek}</span>
        </div>
        {derived.maxAllowedWeek === 1 && (
          <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
            Later weeks unlock after enough calendar time passes, or after you set an earlier cycle start date.
          </p>
        )}
        {message && <p className="muted" role="status" style={{ margin: "12px 0 0", fontSize: 13 }}>{message}</p>}
      </section>

      <section className="card periodization-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Training phases</h2>
          <button className="button secondary small" onClick={addPhase}>Add phase</button>
        </div>
        <div className="phase-list">
          {settings.phases.map((phase) => (
            <article className="phase-row" key={phase.id}>
              <div className="periodization-grid">
                <label>
                  Phase name
                  <input className="field" list="phase-options" value={phase.name} onChange={(event) => updatePhase(phase.id, { name: event.target.value })} />
                </label>
                <label>
                  Start week
                  <input
                    className="field"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    max={settings.totalWeeks}
                    value={phaseWeekDrafts[phase.id]?.startWeek ?? String(phase.startWeek)}
                    onChange={(event) => setPhaseWeekDraft(phase.id, "startWeek", event.target.value)}
                    onBlur={() => commitPhaseWeekDraft(phase, "startWeek")}
                    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  />
                </label>
                <label>
                  End week
                  <input
                    className="field"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    max={settings.totalWeeks}
                    value={phaseWeekDrafts[phase.id]?.endWeek ?? String(phase.endWeek)}
                    onChange={(event) => setPhaseWeekDraft(phase.id, "endWeek", event.target.value)}
                    onBlur={() => commitPhaseWeekDraft(phase, "endWeek")}
                    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  />
                </label>
              </div>
              <label style={{ display: "block", marginTop: 12 }}>
                Focus
                <textarea className="field" rows={3} value={phase.focus} onChange={(event) => updatePhase(phase.id, { focus: event.target.value })} />
              </label>
              <button className="text-button" style={{ marginTop: 10 }} onClick={() => removePhase(phase.id)} disabled={settings.phases.length <= 1}>
                Remove phase
              </button>
            </article>
          ))}
        </div>
        <datalist id="phase-options">
          {phaseOptions.map((option) => <option key={option} value={option} />)}
        </datalist>
      </section>
    </AppShell>
  );
}
