import React, { useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";
import { localDb } from "../db/localDb";
import type { Task } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";

const AVATARS = [
  { id: "avatar_1", icon: "person", label: "Default" },
  { id: "avatar_2", icon: "code", label: "Code" },
  { id: "avatar_3", icon: "fitness_center", label: "Fit" },
  { id: "avatar_4", icon: "bolt", label: "Energy" }
];

const CATEGORY_OPTIONS = [
  { value: "tech", label: "Tech grind" },
  { value: "health", label: "Health & fitness" },
  { value: "discipline", label: "Daily discipline" }
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "GS";
}

export const ProfileScreen: React.FC = () => {
  const { user, profile, setProfile, logout } = useAuth();
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [editingName, setEditingName] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(() => localDb.getTasks());
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("tech");

  const customTasks = useMemo(() => tasks.filter(task => task.isCustom), [tasks]);
  const level = Math.floor(profile.xp / 100) + 1;
  const selectedAvatar = AVATARS.find(avatar => avatar.id === profile.profilePic) ?? AVATARS[0];

  const saveProfileName = () => {
    const updated = localDb.updateProfileInfo(usernameInput.trim() || "Grinder", profile.profilePic);
    setProfile(updated);
    setEditingName(false);
  };

  const selectAvatar = (avatarId: string) => {
    const updated = localDb.updateProfileInfo(profile.username, avatarId);
    setProfile(updated);
  };

  const addCustomTask = () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;
    setTasks(localDb.createCustomTask(trimmed, newTaskCategory));
    setNewTaskName("");
  };

  const deleteCustomTask = (taskId: string) => {
    setTasks(localDb.deleteCustomTask(taskId));
  };

  const resetHeatmap = () => {
    const todayHabits = localDb.getHabitsForToday();
    localStorage.setItem("grindstack_habits", JSON.stringify([todayHabits]));
  };

  return (
    <div className="screen-content">
      <section className="screen-heading">
        <h2>Profile</h2>
        <p>Your account, stats and custom goals.</p>
      </section>

      <GlassCard className="flex-column" style={{ gap: 18 }}>
        <div className="profile-account-row">
          <div className="profile-avatar">
            {initials(profile.username)}
            <span className="material-symbols-outlined" aria-hidden="true">{selectedAvatar.icon}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="text-input"
                  value={usernameInput}
                  onChange={event => setUsernameInput(event.target.value.slice(0, 15))}
                  maxLength={15}
                />
                <button className="btn btn-accent" type="button" onClick={saveProfileName}>Save</button>
              </div>
            ) : (
              <>
                <div className="flex-row-between" style={{ gap: 8 }}>
                  <h3 className="section-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profile.username}
                  </h3>
                  <button
                    className="dashboard-icon-button"
                    type="button"
                    onClick={() => {
                      setUsernameInput(profile.username);
                      setEditingName(true);
                    }}
                    aria-label="Edit name"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                  </button>
                </div>
                <p className="text-xs" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email || "Guest mode"}
                </p>
              </>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        <div className="flex-column" style={{ gap: 10 }}>
          <p className="section-label">Avatar style</p>
          <div className="avatar-style-grid">
            {AVATARS.map(avatar => (
              <button
                key={avatar.id}
                type="button"
                className={`avatar-style-button ${profile.profilePic === avatar.id ? "active" : ""}`}
                onClick={() => selectAvatar(avatar.id)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">{avatar.icon}</span>
                <span>{avatar.label}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="metric-strip">
        <Metric label="Level" value={String(level)} />
        <div className="metric-divider" />
        <Metric label="XP" value={String(profile.xp)} />
        <div className="metric-divider" />
        <Metric label="Streak" value={`${profile.longestStreak}d`} />
        <div className="metric-divider" />
        <Metric label="Done" value={String(profile.totalTasksCompletedAllTime)} />
      </GlassCard>

      <GlassCard className="flex-column" style={{ gap: 14 }}>
        <h3 className="section-title">Custom goals</h3>

        <input
          className="text-input"
          value={newTaskName}
          onChange={event => setNewTaskName(event.target.value)}
          placeholder="e.g. Read 1 chapter of system design"
        />

        <select
          className="select-input"
          value={newTaskCategory}
          onChange={event => setNewTaskCategory(event.target.value)}
          aria-label="Goal category"
        >
          {CATEGORY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button className="btn btn-accent" type="button" onClick={addCustomTask} disabled={!newTaskName.trim()}>
          Add goal
        </button>

        {customTasks.length > 0 && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
            <div className="flex-column" style={{ gap: 8 }}>
              {customTasks.map(task => (
                <div
                  key={task.id}
                  className="log-row"
                  style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)" }}
                >
                  <span className="log-row-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</span>
                  <button className="dashboard-icon-button" type="button" onClick={() => deleteCustomTask(task.id)} aria-label="Delete custom task">
                    <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>

      <div className="advanced-actions">
        <GlassCard className="flex-column" style={{ gap: 12 }}>
          <h3 className="section-title">Advanced</h3>
          <button className="btn btn-secondary" type="button" onClick={resetHeatmap}>
            Reset consistency history
          </button>
        </GlassCard>

        {user && (
          <button className="btn btn-secondary" type="button" onClick={logout}>
            Log out
          </button>
        )}
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="metric-item">
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);
