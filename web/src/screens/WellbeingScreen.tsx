import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { DailyHabits } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";

// Helper: format 24h time to 12h display
const formatTo12h = (time24: string): string => {
  try {
    const [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  } catch {
    return time24;
  }
};

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
    { key: "gymCompleted" as const, title: "Gym / Workout session", checked: habits.gymCompleted },
    { key: "dietCompleted" as const, title: "Diet (Clean nutritious eating)", checked: habits.dietCompleted },
    { key: "skincareCompleted" as const, title: "Skincare routine (AM & PM)", checked: habits.skincareCompleted },
    { key: "sleepCompleted" as const, title: "7+ Hours of Sleep", checked: habits.sleepCompleted },
  ];

  return (
    <div className="screen-content">
      {/* Title */}
      <div>
        <h2 className="bold" style={{ fontSize: "22px" }}>WELLBEING & HEALTH</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
          Maintain physical and mental resilience. Check daily items to stay primed.
        </p>
      </div>

      {/* HEALTH CHECKLIST Section Label */}
      <p className="text-sm semibold" style={{ 
        color: "var(--text-secondary)", 
        textTransform: "uppercase", 
        letterSpacing: "0.5px",
        fontSize: "11px"
      }}>
        HEALTH CHECKLIST
      </p>

      {/* Individual Health Checklist Items */}
      <div className="flex-column" style={{ gap: "8px" }}>
        {habitItems.map(item => (
          <div
            key={item.key}
            className="health-checklist-item"
            onClick={() => handleHabitToggle(item.key)}
          >
            {/* Left: badge + title */}
            <div>
              <span className="health-badge">HEALTH</span>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>
                {item.title}
              </div>
            </div>

            {/* Right: circle checkbox */}
            <div className={`circle-checkbox ${item.checked ? "checked" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Sleep Diary Log */}
      <GlassCard className="flex-column" style={{ gap: "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <span style={{ fontSize: "16px" }}>🌙</span>
          <span className="text-sm semibold" style={{ 
            textTransform: "uppercase", 
            letterSpacing: "1px", 
            color: "var(--text-secondary)",
            fontSize: "11px"
          }}>
            SLEEP DIARY LOG
          </span>
        </div>

        <div className="sleep-time-display">
          <div className="sleep-time-column">
            <div className="sleep-time-label">BEDTIME</div>
            <div className="sleep-time-value">{formatTo12h(habits.bedtime)}</div>
            <input 
              type="time" 
              value={habits.bedtime} 
              onChange={e => handleTimeChange("bedtime", e.target.value)}
              style={{ 
                opacity: 0, 
                position: "absolute", 
                width: 0, 
                height: 0 
              }}
              id="bedtime-input"
            />
          </div>
          <div className="sleep-time-column">
            <div className="sleep-time-label">WAKE TIME</div>
            <div className="sleep-time-value">{formatTo12h(habits.wakeTime)}</div>
            <input 
              type="time" 
              value={habits.wakeTime} 
              onChange={e => handleTimeChange("wakeTime", e.target.value)}
              style={{ 
                opacity: 0, 
                position: "absolute", 
                width: 0, 
                height: 0 
              }}
              id="waketime-input"
            />
          </div>
        </div>

        <div className="sleep-total">
          Total Sleep: {calculateSleepHours(habits.bedtime, habits.wakeTime)} hours
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: "100%", marginTop: "16px" }}
          onClick={() => {
            // Save sleep and mark sleep habit
            localDb.saveDailyHabits(habits);
          }}
        >
          COMMIT SLEEP SCHEDULE
        </button>
      </GlassCard>

      {/* Discipline Engine */}
      <GlassCard>
        <h3 className="semibold" style={{ 
          fontSize: "11px", 
          textTransform: "uppercase", 
          letterSpacing: "1px", 
          color: "var(--text-secondary)", 
          marginBottom: "10px" 
        }}>
          DISCIPLINE ENGINE
        </h3>

        <div className="discipline-toggle-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>
              Screen Time Under Goal Limit
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "13px" }}>
              Limit recreational screen usage to sub-2 hours.
            </p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={(habits as any).screenTimeGoalToggled || false}
              onChange={() => handleDisciplineToggle("screenTimeGoalToggled")}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="discipline-toggle-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>
              Strict Entertainment Caps
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "13px" }}>
              No scrolling Reels/YouTube Shorts or Netflix binging.
            </p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={(habits as any).limitedEntToggled || false}
              onChange={() => handleDisciplineToggle("limitedEntToggled")}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </GlassCard>
    </div>
  );
};
