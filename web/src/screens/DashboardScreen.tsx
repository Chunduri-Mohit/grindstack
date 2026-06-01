import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { Task, DailyHabits } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";
import { CircularProgress } from "../components/CircularProgress";

const MOTIVATIONAL_QUOTES = [
  "No excuses, just grind.",
  "Focus on the process, not the outcome.",
  "Consistency beats talent every single time.",
  "Reclaim your focus, step by step.",
  "Do it for your future self.",
  "Discipline is choosing between what you want now and what you want most."
];

export const DashboardScreen: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quote, setQuote] = useState("");
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [habitsHistory, setHabitsHistory] = useState<DailyHabits[]>([]);

  useEffect(() => {
    setTasks(localDb.getTasks());
    setHabitsHistory(localDb.getAllHabits());
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleTaskClick = (task: Task) => {
    if (!task.isCompleted) {
      // User is checking an uncompleted task -> show confirmation dialog
      setConfirmTask(task);
    } else {
      // User is unchecking a completed task -> toggle directly
      toggleTask(task.id, false);
    }
  };

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    const { tasks: updatedTasks } = await localDb.toggleTaskCompletion(taskId, isCompleted);
    setTasks(updatedTasks);
    setHabitsHistory(localDb.getAllHabits());
    await refreshProfile();
  };

  const getHeatmapClass = (habit: DailyHabits | undefined) => {
    if (!habit) return "";
    let count = 0;
    if (habit.gymCompleted) count++;
    if (habit.dietCompleted) count++;
    if (habit.skincareCompleted) count++;
    if (habit.sleepCompleted) count++;

    if (count === 0) return "";
    return `completed-${count}`;
  };

  // Generate 21 days for the heatmap (last 20 days + today)
  const getHeatmapDays = () => {
    const days = [];
    const today = new Date();
    const dateFormat = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = dateFormat(d);
      const habit = habitsHistory.find(h => h.dateString === ds);
      days.push({
        dateString: ds,
        label: d.getDate(),
        isToday: i === 0,
        habit
      });
    }
    return days;
  };

  const categorizedTasks = {
    tech: tasks.filter(t => t.category === "tech"),
    health: tasks.filter(t => t.category === "health"),
    discipline: tasks.filter(t => t.category === "discipline" || (t.category !== "tech" && t.category !== "health"))
  };

  return (
    <div className="screen-content">
      {/* Header Info */}
      <div className="flex-row-between" style={{ alignItems: "center" }}>
        <div>
          <h2 className="bold" style={{ fontSize: "22px" }}>Hey, {profile.username}</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Streak: <span className="orange-accent semibold">{profile.longestStreak} days</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="badge badge-purple">LVL {Math.floor(profile.xp / 100) + 1}</span>
          <span className="badge badge-orange">{profile.xp} XP</span>
        </div>
      </div>

      {/* Circle Progress + Quote */}
      <GlassCard className="flex-row-between" style={{ padding: "20px 24px", gap: "20px" }}>
        <div style={{ flex: 1, textAlign: "left" }}>
          <p className="text-xs" style={{ textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>Daily Progress</p>
          <h3 className="semibold text-md" style={{ marginTop: "4px", marginBottom: "8px", color: "var(--text-primary)" }}>Reclaim your focus</h3>
          <p className="text-sm" style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>"{quote}"</p>
        </div>
        <CircularProgress 
          percentage={completionPercentage} 
          centerValue={`${completedTasks}/${totalTasks}`} 
          centerText="Tasks Done" 
        />
      </GlassCard>

      {/* Checklists - Moved UP */}
      <div className="flex-column" style={{ gap: "16px" }}>
        {/* TECH CATEGORY */}
        {categorizedTasks.tech.length > 0 && (
          <GlassCard>
            <div className="flex-row-between" style={{ marginBottom: "10px" }}>
              <h3 className="bold text-sm" style={{ letterSpacing: "0.5px", color: "var(--accent-orange)" }}>TECH GRIND</h3>
              <span className="badge badge-orange">{categorizedTasks.tech.filter(t => t.isCompleted).length}/{categorizedTasks.tech.length}</span>
            </div>
            <div className="flex-column" style={{ gap: "4px" }}>
              {categorizedTasks.tech.map(task => (
                <div key={task.id} className="checklist-item">
                  <div 
                    className={`checkbox-custom ${task.isCompleted ? "checked" : ""}`}
                    onClick={() => handleTaskClick(task)}
                    style={{ borderColor: "var(--accent-orange)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span 
                    className={`checklist-label ${task.isCompleted ? "completed" : ""}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    {task.name}
                    {task.streak > 0 && (
                      <span className="orange-accent text-xs" style={{ marginLeft: "8px" }}>🔥 {task.streak}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* HEALTH CATEGORY */}
        {categorizedTasks.health.length > 0 && (
          <GlassCard>
            <div className="flex-row-between" style={{ marginBottom: "10px" }}>
              <h3 className="bold text-sm" style={{ letterSpacing: "0.5px", color: "var(--accent-green)" }}>HEALTH & FITNESS</h3>
              <span className="badge badge-green">{categorizedTasks.health.filter(t => t.isCompleted).length}/{categorizedTasks.health.length}</span>
            </div>
            <div className="flex-column" style={{ gap: "4px" }}>
              {categorizedTasks.health.map(task => (
                <div key={task.id} className="checklist-item">
                  <div 
                    className={`checkbox-custom ${task.isCompleted ? "checked" : ""}`}
                    onClick={() => handleTaskClick(task)}
                    style={{ borderColor: "var(--accent-green)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span 
                    className={`checklist-label ${task.isCompleted ? "completed" : ""}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    {task.name}
                    {task.streak > 0 && (
                      <span className="green-accent text-xs" style={{ marginLeft: "8px" }}>🔥 {task.streak}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* DISCIPLINE CATEGORY */}
        {categorizedTasks.discipline.length > 0 && (
          <GlassCard>
            <div className="flex-row-between" style={{ marginBottom: "10px" }}>
              <h3 className="bold text-sm" style={{ letterSpacing: "0.5px", color: "var(--accent-purple)" }}>DAILY DISCIPLINE</h3>
              <span className="badge badge-purple">{categorizedTasks.discipline.filter(t => t.isCompleted).length}/{categorizedTasks.discipline.length}</span>
            </div>
            <div className="flex-column" style={{ gap: "4px" }}>
              {categorizedTasks.discipline.map(task => (
                <div key={task.id} className="checklist-item">
                  <div 
                    className={`checkbox-custom ${task.isCompleted ? "checked" : ""}`}
                    onClick={() => handleTaskClick(task)}
                    style={{ borderColor: "var(--accent-purple)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span 
                    className={`checklist-label ${task.isCompleted ? "completed" : ""}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    {task.name}
                    {task.streak > 0 && (
                      <span className="purple-accent text-xs" style={{ marginLeft: "8px" }}>🔥 {task.streak}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Heatmap - Moved DOWN */}
      <GlassCard className="heatmap-container">
        <h3 className="semibold text-sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
          Consistency Heatmap (Last 21 Days)
        </h3>
        <div className="heatmap-grid">
          {getHeatmapDays().map((day, idx) => (
            <div
              key={idx}
              className={`heatmap-day ${getHeatmapClass(day.habit)} ${day.isToday ? "current" : ""}`}
              title={`${day.dateString}: ${day.habit ? 'Logged' : 'No logs'}`}
            >
              {day.label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "8px", fontSize: "10px", color: "var(--text-muted)", alignItems: "center" }}>
          <span>0 completed</span>
          <div style={{ width: "12px", height: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "2px" }} />
          <div style={{ width: "12px", height: "12px", background: "rgba(74, 222, 128, 0.15)", borderRadius: "2px" }} />
          <div style={{ width: "12px", height: "12px", background: "rgba(74, 222, 128, 0.3)", borderRadius: "2px" }} />
          <div style={{ width: "12px", height: "12px", background: "rgba(74, 222, 128, 0.45)", borderRadius: "2px" }} />
          <div style={{ width: "12px", height: "12px", background: "rgba(74, 222, 128, 0.65)", borderRadius: "2px" }} />
          <span>4 completed</span>
        </div>
      </GlassCard>

      {/* Confirmation Dialog Modal */}
      {confirmTask && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "20px"
        }}>
          <GlassCard style={{ width: "100%", maxWidth: "340px", textAlign: "center", padding: "24px" }}>
            <h3 className="bold text-md" style={{ color: "var(--text-primary)", marginBottom: "14px" }}>CONFIRM COMPLETION</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Mark "{confirmTask.name}" as completed?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setConfirmTask(null)}
              >
                CANCEL
              </button>
              <button 
                className="btn btn-accent" 
                style={{ flex: 1 }}
                onClick={() => {
                  toggleTask(confirmTask.id, true);
                  // Android feature: if tech log, log studies automatically
                  if (confirmTask.category.toLowerCase() === "tech") {
                    localDb.addTechLog(`Completed: ${confirmTask.name}`, "LeetCode", 1);
                  }
                  setConfirmTask(null);
                }}
              >
                CONFIRM
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
