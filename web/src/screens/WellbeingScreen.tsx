import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import { localDb } from "../db/localDb";
import type { DailyHabits } from "../db/localDb";
import { CircularProgress } from "../components/CircularProgress";
import { GlassCard } from "../components/GlassCard";
import { TimeInput } from "../components/TimeInput";
import { ToggleSwitch } from "../components/ToggleSwitch";

type HabitKey = "gymCompleted" | "dietCompleted" | "skincareCompleted" | "sleepCompleted";

const HABITS: Array<{ key: HabitKey; type: string; title: string; icon: string }> = [
  { key: "gymCompleted", type: "gym", title: "Gym / workout", icon: "fitness_center" },
  { key: "dietCompleted", type: "diet", title: "Clean nutrition", icon: "restaurant" },
  { key: "skincareCompleted", type: "skincare", title: "Skincare (AM & PM)", icon: "face" },
  { key: "sleepCompleted", type: "sleep", title: "7+ hours sleep", icon: "bedtime" }
];

function calculateSleepHours(bed: string, wake: string): string {
  try {
    const [bedHours, bedMinutes] = bed.split(":").map(Number);
    const [wakeHours, wakeMinutes] = wake.split(":").map(Number);
    const bedTotal = bedHours * 60 + bedMinutes;
    let wakeTotal = wakeHours * 60 + wakeMinutes;
    if (wakeTotal <= bedTotal) wakeTotal += 24 * 60;
    return ((wakeTotal - bedTotal) / 60).toFixed(1);
  } catch {
    return "8.0";
  }
}

function applySleepGoal(habits: DailyHabits): DailyHabits {
  const hours = Number(calculateSleepHours(habits.bedtime, habits.wakeTime));
  return {
    ...habits,
    sleepCompleted: Number.isFinite(hours) ? hours >= 7 : habits.sleepCompleted
  };
}

export const WellbeingScreen: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [habits, setHabits] = useState<DailyHabits | null>(() => localDb.getHabitsForToday());

  if (!habits) return null;

  const doneCount = HABITS.filter(item => habits[item.key]).length;

  const persistHabits = async (updated: DailyHabits, refresh = true) => {
    setHabits(updated);
    localDb.saveDailyHabits(updated);
    if (refresh) await refreshProfile();
  };

  const toggleHabit = async (key: HabitKey) => {
    await persistHabits({ ...habits, [key]: !habits[key] });
  };

  const updateTime = (key: "bedtime" | "wakeTime", value: string) => {
    setHabits(current => current ? { ...current, [key]: value } : current);
  };

  const saveSleepSchedule = async () => {
    await persistHabits(applySleepGoal(habits));
  };

  const updateDiscipline = async (key: "screenTimeGoalToggled" | "limitedEntToggled", value: boolean) => {
    await persistHabits({ ...habits, [key]: value }, false);
  };

  return (
    <div className="screen-content">
      <section className="screen-heading">
        <h2>Wellbeing</h2>
        <p>Stay primed. Check off your daily basics.</p>
      </section>

      <section className="habit-hero">
        <CircularProgress
          percentage={(doneCount / 4) * 100}
          size={168}
          strokeWidth={13}
          centerValue={doneCount}
          centerText="of 4 habits"
        />
      </section>

      <GlassCard className="habit-list">
        {HABITS.map(item => {
          const checked = habits[item.key];
          return (
            <button
              className="habit-row"
              key={item.key}
              type="button"
              onClick={() => toggleHabit(item.key)}
            >
              <div className="log-row" style={{ padding: 0, justifyContent: "flex-start", minWidth: 0, flex: 1 }}>
                <span className="row-icon" style={{ background: checked ? "rgba(201, 242, 76, 0.16)" : "rgba(255, 255, 255, 0.05)" }}>
                  <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                </span>
                <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  <p className="habit-title">{item.title}</p>
                  <p className="habit-subtitle">HEALTH</p>
                </div>
              </div>
              <span className={`circle-status ${checked ? "checked" : ""}`} aria-hidden="true">
                {checked && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
              </span>
            </button>
          );
        })}
      </GlassCard>

      <GlassCard className="flex-column" style={{ gap: 16 }}>
        <div className="log-row" style={{ justifyContent: "flex-start", padding: 0 }}>
          <span className="row-icon">
            <span className="material-symbols-outlined" aria-hidden="true">bedtime</span>
          </span>
          <h3 className="section-title">Sleep</h3>
        </div>

        <div className="sleep-grid">
          <TimeInput label="Bedtime" value={habits.bedtime} onChange={value => updateTime("bedtime", value)} variant="compact" />
          <TimeInput label="Wake" value={habits.wakeTime} onChange={value => updateTime("wakeTime", value)} variant="compact" />
        </div>

        <div className="sleep-total-box">
          <span>Total sleep</span>
          <strong>{calculateSleepHours(habits.bedtime, habits.wakeTime)} hrs</strong>
        </div>

        <button className="btn btn-accent" type="button" onClick={saveSleepSchedule}>
          Save sleep schedule
        </button>
      </GlassCard>

      <GlassCard className="flex-column" style={{ gap: 8 }}>
        <div className="log-row" style={{ justifyContent: "flex-start", padding: 0 }}>
          <span className="row-icon">
            <span className="material-symbols-outlined" aria-hidden="true">shield</span>
          </span>
          <h3 className="section-title">Discipline</h3>
        </div>

        <ToggleSwitch
          title="Screen time under limit"
          description="Keep recreational use under 2 hours."
          checked={habits.screenTimeGoalToggled}
          onChange={checked => updateDiscipline("screenTimeGoalToggled", checked)}
        />
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
        <ToggleSwitch
          title="Strict entertainment cap"
          description="No Reels, Shorts or binge sessions."
          checked={habits.limitedEntToggled}
          onChange={checked => updateDiscipline("limitedEntToggled", checked)}
        />
      </GlassCard>
    </div>
  );
};
