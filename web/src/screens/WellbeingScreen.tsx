import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { DailyHabits } from "../db/localDb";
import { TimeInput } from "../components/TimeInput";
import { ToggleSwitch } from "../components/ToggleSwitch";

// Helper: calculate sleep duration in hours
const calculateSleepHours = (bed: string, wake: string): string => {
  try {
    const [bH, bM] = bed.split(":").map(Number);
    const [wH, wM] = wake.split(":").map(Number);
    let bedMins = bH * 60 + bM;
    let wakeMins = wH * 60 + wM;
    if (wakeMins <= bedMins) wakeMins += 24 * 60;
    const diffMins = wakeMins - bedMins;
    return (diffMins / 60).toFixed(1);
  } catch {
    return "8.0";
  }
};

export const WellbeingScreen: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [habits, setHabits] = useState<DailyHabits | null>(null);

  useEffect(() => {
    setHabits(localDb.getHabitsForToday());
  }, []);

  if (!habits) return null;

  const handleHabitToggle = async (key: keyof Pick<DailyHabits, "gymCompleted" | "dietCompleted" | "skincareCompleted" | "sleepCompleted">) => {
    if (!habits) return;
    const updated = {
      ...habits,
      [key]: !habits[key]
    };
    setHabits(updated);
    await localDb.saveDailyHabits(updated);
    await refreshProfile();
  };

  const handleTimeChange = async (key: "bedtime" | "wakeTime", value: string) => {
    if (!habits) return;
    const updated = {
      ...habits,
      [key]: value
    };
    setHabits(updated);
    await localDb.saveDailyHabits(updated);
  };

  const handleDisciplineToggle = async (key: "screenTimeGoalToggled" | "limitedEntToggled") => {
    if (!habits) return;
    const updated = {
      ...habits,
      [key]: !(habits as any)[key]
    };
    setHabits(updated);
    await localDb.saveDailyHabits(updated);
  };

  const habitItems = [
    { key: "gymCompleted" as const, title: "Gym / Workout session", checked: habits.gymCompleted, icon: "fitness_center" },
    { key: "dietCompleted" as const, title: "Diet (Clean nutritious eating)", checked: habits.dietCompleted, icon: "nutrition" },
    { key: "skincareCompleted" as const, title: "Skincare routine (AM & PM)", checked: habits.skincareCompleted, icon: "face" },
    { key: "sleepCompleted" as const, title: "7+ Hours of Sleep", checked: habits.sleepCompleted, icon: "bedtime" },
  ];

  return (
    <div className="space-y-stack-lg w-full pb-20">
      {/* Header Section */}
      <section className="flex flex-col gap-unit">
        <h2 className="font-section text-section text-on-surface">Focus Intelligence</h2>
        <p className="font-body text-body text-on-surface-variant">
          Maintain physical and mental resilience. Check daily items to stay primed.
        </p>
      </section>

      {/* HEALTH CHECKLIST Section */}
      <section className="space-y-3">
        <h3 className="font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase px-1">
          Health Checklist
        </h3>

        <div className="space-y-2">
          {habitItems.map(item => (
            <div
              key={item.key}
              onClick={() => handleHabitToggle(item.key)}
              className="glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 transition-colors ${
                  item.checked ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-container text-on-surface-variant group-hover:text-primary"
                }`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-card-title text-sm text-on-surface font-semibold">{item.title}</span>
                  <span className="font-body text-[11px] text-emerald-400 font-semibold mt-0.5">HEALTH</span>
                </div>
              </div>

              {/* Circle Checkbox */}
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                item.checked
                  ? "bg-emerald-500 border-emerald-500 text-black"
                  : "border-white/20"
              }`}>
                {item.checked && (
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sleep Diary Log */}
      <section className="glass-panel rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">bedtime</span>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase">
            Sleep Diary Log
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TimeInput
            label="BEDTIME"
            value={habits.bedtime}
            onChange={(value) => handleTimeChange("bedtime", value)}
            variant="compact"
          />

          <TimeInput
            label="WAKE TIME"
            value={habits.wakeTime}
            onChange={(value) => handleTimeChange("wakeTime", value)}
            variant="compact"
          />
        </div>

        <div className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 mt-2">
          <span className="text-xs text-on-surface font-semibold">Total Sleep Duration:</span>
          <span className="text-sm font-bold text-emerald-400">
            {calculateSleepHours(habits.bedtime, habits.wakeTime)} hours
          </span>
        </div>

        <button
          className="w-full bg-primary text-on-primary font-section py-3 rounded-full relative overflow-hidden transition-transform duration-300 hover:scale-[1.02] text-sm mt-2"
          onClick={() => {
            localDb.saveDailyHabits(habits);
            alert("Sleep schedule committed!");
          }}
        >
          Commit Sleep Schedule
        </button>
      </section>

      {/* Discipline Engine */}
      <section className="glass-panel rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase mb-2">
          Discipline Engine
        </h3>

        <div className="divide-y divide-white/5 space-y-4">
          <div className="pt-1">
            <ToggleSwitch
              title="Screen Time Under Goal Limit"
              description="Limit recreational screen usage to sub-2 hours."
              checked={(habits as any).screenTimeGoalToggled || false}
              onChange={() => handleDisciplineToggle("screenTimeGoalToggled")}
            />
          </div>

          <div className="pt-4">
            <ToggleSwitch
              title="Strict Entertainment Caps"
              description="No scrolling Reels/YouTube Shorts or Netflix binging."
              checked={(habits as any).limitedEntToggled || false}
              onChange={() => handleDisciplineToggle("limitedEntToggled")}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
