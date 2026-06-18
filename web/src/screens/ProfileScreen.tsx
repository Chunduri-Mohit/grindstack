import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { Task } from "../db/localDb";
import { ToggleSwitch } from "../components/ToggleSwitch";

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

  // Custom Settings Toggles (Vault Settings UI)
  const [biometricLock, setBiometricLock] = useState(() => localStorage.getItem("vault_biometric_lock") === "true");
  const [protocolEncryption, setProtocolEncryption] = useState(() => localStorage.getItem("vault_protocol_encryption") !== "false");

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

  const handleToggleBiometric = (checked: boolean) => {
    setBiometricLock(checked);
    localStorage.setItem("vault_biometric_lock", String(checked));
  };

  const handleToggleEncryption = (checked: boolean) => {
    setProtocolEncryption(checked);
    localStorage.setItem("vault_protocol_encryption", String(checked));
  };

  const handleExportData = () => {
    try {
      const data = {
        profile: localDb.getProfile(),
        techLogs: localDb.getTechLogs(),
        tasks: localDb.getTasks(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grindstack-metrics-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Failed to export data.");
    }
  };

  // Calculate dynamic security/integrity score based on toggles
  const integrityScore = 70 + (biometricLock ? 15 : 0) + (protocolEncryption ? 13 : 0);
  const strokeOffset = 283 - (283 * integrityScore) / 100;

  return (
    <div className="space-y-stack-lg w-full pb-20">
      {/* Header Section */}
      <section className="flex flex-col gap-unit">
        <h2 className="font-section text-section text-on-surface">The Vault Settings</h2>
        <p className="font-body text-body text-on-surface-variant max-w-[280px]">
          Manage biometric locks, protocol encryption, and performance privacy.
        </p>
      </section>

      {/* Account Info and Username Editing */}
      <section className="glass-panel rounded-xl p-5 flex flex-col items-center">
        {/* Avatar Display */}
        <div className="w-16 h-16 rounded-full bg-white/5 border border-primary flex items-center justify-center text-3xl mb-4">
          {AVATARS.find(a => a.id === profile.profilePic)?.emoji || "🧑‍💻"}
        </div>

        {/* Username Editor */}
        {editingName ? (
          <div className="flex gap-2 w-full max-w-[240px]">
            <input
              type="text"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-2 text-center text-on-surface outline-none focus:border-primary focus:bg-white/[0.04]"
              maxLength={15}
            />
            <button
              className="bg-primary text-on-primary text-xs font-label-caps px-4 py-2 rounded-lg"
              onClick={handleSaveProfile}
            >
              SAVE
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-card-title text-card-title text-on-surface font-semibold">{profile.username}</h3>
            <button
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setEditingName(true)}
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
        )}

        <p className="text-xs text-on-surface-variant mt-1">
          {user?.email || "Local Guest Mode"}
        </p>

        {/* Avatar Picking Grid */}
        <div className="w-full mt-6 border-t border-white/5 pt-4">
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider text-center mb-3">
            Choose Profile Avatar
          </p>
          <div className="flex justify-center gap-3">
            {AVATARS.map(avatar => (
              <div
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                className={`p-3 rounded-xl cursor-pointer text-2xl transition-all border ${
                  profile.profilePic === avatar.id
                    ? "bg-primary/10 border-primary scale-110"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                }`}
                title={avatar.label}
              >
                {avatar.emoji}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Score Card Centerpiece */}
      <section className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-stack-md relative overflow-hidden">
        {/* Subtle inner glow behind the ring */}
        <div className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none"></div>
        <h3 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase w-full text-center">
          Security Score
        </h3>

        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Inner ambient glow */}
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full"></div>
          {/* SVG Ring */}
          <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle className="text-white/5" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="2"></circle>
            {/* Animated Progress Track */}
            <circle
              className="text-primary drop-shadow-[0_0_8px_rgba(208,188,255,0.6)] transition-all duration-500"
              cx="50"
              cy="50"
              fill="none"
              r="45"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="4"
              strokeDasharray="283"
              strokeDashoffset={strokeOffset}
            ></circle>
          </svg>
          {/* Center Value */}
          <div className="absolute flex flex-col items-center justify-center z-20">
            <span className="font-hero text-3xl text-on-surface leading-none font-semibold">
              {integrityScore}<span className="text-sm text-primary">%</span>
            </span>
            <span className="font-label-caps text-[9px] text-primary mt-1">Integrity</span>
          </div>
        </div>

        <div className="bg-surface-container-high rounded-full px-4 py-1.5 border border-white/5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_locked</span>
          <span className="font-label-caps text-[9px] text-on-surface">Protocols Enforced</span>
        </div>
      </section>

      {/* Configuration List Items */}
      <section className="flex flex-col gap-3">
        <h3 className="font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase px-1">
          Access & Encryption
        </h3>

        {/* Item: Biometric Authentication */}
        <ToggleSwitch
          icon="fingerprint"
          title="Biometric Lock"
          description="Require Face ID for access"
          checked={biometricLock}
          onChange={handleToggleBiometric}
        />

        {/* Item: Protocol Encryption */}
        <ToggleSwitch
          icon="enhanced_encryption"
          title="Protocol Encryption"
          description="End-to-end telemetry sync"
          checked={protocolEncryption}
          onChange={handleToggleEncryption}
        />

        {/* Item: Data Portability */}
        <button
          onClick={handleExportData}
          className="w-full glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors text-left outline-none border border-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-on-surface transition-colors border border-white/5">
              <span className="material-symbols-outlined">data_exploration</span>
            </div>
            <div className="flex flex-col">
              <span className="font-card-title text-sm text-on-surface font-semibold">Data Portability</span>
              <span className="font-body text-xs text-on-surface-variant leading-tight mt-0.5">Export raw discipline metrics</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors mr-1">chevron_right</span>
        </button>
      </section>

      {/* Custom Task Designer (re-styled beautifully) */}
      <section className="glass-panel rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
          Custom Task Designer
        </h3>

        <form onSubmit={handleCreateCustomTask} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Task Name</span>
            <input
              type="text"
              placeholder="e.g. Read 1 chapter of system design"
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-3 text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary focus:bg-white/[0.04] text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Task Category</span>
            <select
              value={newTaskCategory}
              onChange={e => setNewTaskCategory(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg p-3 text-on-surface outline-none focus:border-primary text-sm cursor-pointer"
            >
              <option value="tech" className="bg-background">Tech Grind (Orange)</option>
              <option value="health" className="bg-background">Health & Fitness (Green)</option>
              <option value="discipline" className="bg-background">Daily Discipline (Purple)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary font-section py-3 rounded-full relative overflow-hidden transition-transform duration-300 hover:scale-[1.02] text-sm"
          >
            CREATE CUSTOM TASK
          </button>
        </form>

        {/* Existing Custom Tasks List */}
        {customTasks.length > 0 && (
          <div className="mt-4 border-t border-white/5 pt-4">
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-3">
              Your Custom Tasks
            </p>
            <div className="space-y-2">
              {customTasks.map(task => (
                <div key={task.id} className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-xl p-3">
                  <span className="text-xs text-on-surface font-semibold truncate max-w-[180px]">{task.name}</span>
                  <button
                    className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg text-[10px] font-label-caps hover:bg-red-500/20 transition-colors"
                    onClick={() => handleDeleteCustomTask(task.id)}
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Action Buttons (Reset & Logout) */}
      <section className="space-y-2">
        <button
          className="w-full bg-white/[0.02] border border-white/5 hover:border-red-500/25 hover:bg-red-500/5 transition-all text-red-400/80 font-label-caps text-xs py-3.5 rounded-xl text-center"
          onClick={() => {
            if (window.confirm("Reset your consistency heatmap history?")) {
              localDb.clearAllData();
              window.location.reload();
            }
          }}
        >
          RESET CONSISTENCY HEATMAP
        </button>

        {user && (
          <button
            className="w-full bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20 text-red-400 font-label-caps text-xs py-3.5 rounded-xl text-center"
            onClick={logout}
          >
            Logout & Switch Account
          </button>
        )}
      </section>
    </div>
  );
};
