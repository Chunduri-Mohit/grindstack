import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { Task } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";

const AVATARS = [
  { id: "avatar_1", emoji: "🧑‍💻", label: "Developer" },
  { id: "avatar_2", emoji: "🦁", label: "Lion" },
  { id: "avatar_3", emoji: "🥋", label: "Fighter" },
  { id: "avatar_4", emoji: "🚀", label: "Astronaut" }
];

export const ProfileScreen: React.FC = () => {
  const { user, profile, setProfile, logout } = useAuth();
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [editingName, setEditingName] = useState(false);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  
  // Custom Task creator state
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("tech");

  useEffect(() => {
    setUsernameInput(profile.username);
    setCustomTasks(localDb.getTasks().filter(t => t.isCustom));
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!usernameInput.trim()) return;
    localDb.updateProfileInfo(usernameInput.trim(), profile.profilePic);
    setProfile(localDb.getProfile());
    setEditingName(false);
    alert("Profile updated!");
  };

  const handleAvatarSelect = async (avatarId: string) => {
    await localDb.updateProfileInfo(profile.username, avatarId);
    setProfile(localDb.getProfile());
  };

  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const updatedTasks = localDb.createCustomTask(newTaskName.trim(), newTaskCategory);
    setCustomTasks(updatedTasks.filter(t => t.isCustom));
    setNewTaskName("");
    alert("Custom task added to your dashboard!");
  };

  const handleDeleteCustomTask = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this custom task?")) {
      const updatedTasks = localDb.deleteCustomTask(taskId);
      setCustomTasks(updatedTasks.filter(t => t.isCustom));
    }
  };

  return (
    <div className="screen-content">
      {/* Title */}
      <div>
        <h2 className="bold" style={{ fontSize: "22px" }}>USER PROFILE</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
          Manage your identity, design custom tasks, or switch accounts.
        </p>
      </div>

      {/* Account Details */}
      <GlassCard className="flex-column" style={{ alignItems: "center", padding: "24px 20px" }}>
        {/* Avatar Display */}
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.03)",
          border: "2px solid var(--accent-orange)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          marginBottom: "12px"
        }}>
          {AVATARS.find(a => a.id === profile.profilePic)?.emoji || "🧑‍💻"}
        </div>

        {/* Username Editor */}
        {editingName ? (
          <div style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "240px" }}>
            <input 
              type="text" 
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              className="text-input"
              style={{ textAlign: "center", padding: "8px" }}
              maxLength={15}
            />
            <button className="btn btn-accent" onClick={handleSaveProfile} style={{ padding: "8px 12px" }}>
              SAVE
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 className="bold text-lg" style={{ color: "var(--text-primary)" }}>{profile.username}</h3>
            <button 
              className="btn-icon-only" 
              onClick={() => setEditingName(true)}
              style={{ padding: "4px 6px", borderRadius: "4px" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.013a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
          </div>
        )}

        <p className="text-xs" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
          {user?.email || "Local Guest Mode"}
        </p>

        {/* Avatar Picking Grid */}
        <div style={{ width: "100%", marginTop: "16px" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", textAlign: "center" }}>
            Choose Profile Avatar
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            {AVATARS.map(avatar => (
              <div 
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  background: profile.profilePic === avatar.id ? "var(--accent-orange-bg)" : "rgba(255,255,255,0.01)",
                  border: profile.profilePic === avatar.id ? "1.5px solid var(--accent-orange)" : "1px solid var(--card-border)",
                  cursor: "pointer",
                  fontSize: "22px",
                  transition: "var(--transition-smooth)"
                }}
                title={avatar.label}
              >
                {avatar.emoji}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Custom Task Designer */}
      <GlassCard className="flex-column">
        <h3 className="semibold text-sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
          Custom Task Designer
        </h3>
        <form onSubmit={handleCreateCustomTask} className="flex-column" style={{ gap: "12px" }}>
          <div className="input-group">
            <span className="input-label">Task Name</span>
            <input 
              type="text" 
              placeholder="e.g. Read 1 chapter of system design" 
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
              className="text-input"
              required
            />
          </div>

          <div className="input-group">
            <span className="input-label">Task Category</span>
            <select 
              value={newTaskCategory}
              onChange={e => setNewTaskCategory(e.target.value)}
              className="text-input"
              style={{ background: "rgba(17,16,8,0.9)", color: "var(--text-primary)" }}
            >
              <option value="tech">Tech Grind (Orange)</option>
              <option value="health">Health & Fitness (Green)</option>
              <option value="discipline">Daily Discipline (Purple)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "6px" }}>
            CREATE CUSTOM TASK
          </button>
        </form>

        <button
          className="btn btn-secondary"
          style={{ width: "100%", marginTop: "10px", fontSize: "12px", border: "1px solid rgba(255,255,255,0.05)" }}
          onClick={() => {
            if (window.confirm("Reset your consistency heatmap history?")) {
              localDb.clearAllData(); // Or just clear habits
              window.location.reload();
            }
          }}
        >
          RESET CONSISTENCY HEATMAP
        </button>

        {/* Existing Custom Tasks List */}
        {customTasks.length > 0 && (
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
            <p className="text-xs" style={{ color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Your Custom Tasks
            </p>
            <div className="flex-column" style={{ gap: "8px" }}>
              {customTasks.map(task => (
                <div key={task.id} className="flex-row-between" style={{ background: "rgba(255,255,255,0.01)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--card-border)" }}>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{task.name}</span>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "6px" }}
                    onClick={() => handleDeleteCustomTask(task.id)}
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Logout Action */}
      {user && (
        <button 
          className="btn btn-secondary" 
          onClick={logout}
          style={{ width: "100%", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "14px" }}
        >
          Logout & Switch Account
        </button>
      )}
    </div>
  );
};
