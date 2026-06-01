import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { TechLog } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";

const SUBJECTS = ["Problem Solving", "Web Dev", "Python", "Java", "CRT", "Striver's DSA Sheet"];
const PLATFORMS = ["LeetCode", "CodeChef", "Smart Interviews", "Striver's Sheet"];

const SUBJECT_TARGETS: Record<string, number> = {
  "Problem Solving": 200,
  "Web Dev": 100,
  "Python": 60,
  "Java": 60,
  "CRT": 120,
  "Striver's DSA Sheet": 450
};

function resolveSubject(topic: string, platform: string): string {
  const topicLower = topic.toLowerCase().trim();
  const platformLower = platform.toLowerCase().trim();

  if (topicLower.includes("striver") || platformLower.includes("striver") || platformLower.includes("sheet")) {
    return "Striver's DSA Sheet";
  }
  if (topicLower.includes("crt") || topicLower.includes("smart") || topicLower.includes("interview") || platformLower.includes("smart") || platformLower.includes("interview")) {
    return "CRT";
  }
  if (topicLower.includes("web") || topicLower.includes("html") || topicLower.includes("css") || topicLower.includes("js") || topicLower.includes("javascript") || topicLower.includes("react") || topicLower.includes("node") || platformLower.includes("web")) {
    return "Web Dev";
  }
  if (topicLower.includes("python") || topicLower.includes("django") || topicLower.includes("flask") || topicLower.includes("numpy") || topicLower.includes("pandas") || topicLower.includes("py")) {
    return "Python";
  }
  if (topicLower.includes("java") && !topicLower.includes("javascript") && !topicLower.includes("js")) {
    return "Java";
  }
  if (topicLower.includes("problem") || topicLower.includes("solving") || topicLower.includes("dsa") || topicLower.includes("leetcode") || topicLower.includes("codechef") || platformLower.includes("leetcode") || platformLower.includes("codechef")) {
    return "Problem Solving";
  }

  const matched = SUBJECTS.find(s => s.toLowerCase() === topicLower);
  return matched || "Problem Solving";
}

export const AcademyScreen: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [techLogs, setTechLogs] = useState<TechLog[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [countInput, setCountInput] = useState("");

  useEffect(() => {
    setTechLogs(localDb.getTechLogs());
  }, []);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(countInput) || 1;
    const newLog = localDb.addTechLog(selectedSubject, selectedPlatform, count);
    setTechLogs([newLog, ...techLogs]);
    setCountInput("");
    await refreshProfile();
  };

  // Calculate subject progress maps
  const getSubjectProgress = (subj: string) => {
    const totalCount = techLogs
      .filter(log => resolveSubject(log.topic, log.platform) === subj)
      .reduce((sum, log) => sum + log.count, 0);

    const target = SUBJECT_TARGETS[subj] || 40;
    const percentage = Math.min(100, (totalCount / target) * 100);
    return { count: totalCount, percentage, target };
  };

  return (
    <div className="screen-content">
      {/* Title */}
      <div>
        <h2 className="bold" style={{ fontSize: "22px" }}>ACADEMY & CODING</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
          Log problems or topics study sessions. Earn 15 XP each.
        </p>
      </div>

      {/* Subject Progression */}
      <GlassCard className="flex-column" style={{ gap: "14px" }}>
        <h3 className="semibold text-sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
          Subject Progression
        </h3>
        
        <div className="flex-column" style={{ gap: "12px" }}>
          {SUBJECTS.map(subj => {
            const { count, percentage, target } = getSubjectProgress(subj);
            return (
              <div key={subj}>
                <div className="flex-row-between" style={{ marginBottom: "6px" }}>
                  <span className="text-sm semibold" style={{ color: "var(--text-primary)" }}>{subj}</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{count} / {target}</span>
                </div>
                <div style={{
                  width: "100%",
                  height: "6px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: "100%",
                    background: "var(--text-primary)",
                    borderRadius: "8px",
                    transition: "width 0.3s ease-in-out"
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Manual log form */}
      <GlassCard>
        <h3 className="semibold text-sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          LOG NEW CODING ATTACK
        </h3>
        <form onSubmit={handleLogSubmit} className="flex-column">
          <div className="input-group">
            <span className="input-label">Subject / Topic</span>
            <select 
              value={selectedSubject} 
              onChange={e => setSelectedSubject(e.target.value)}
              className="text-input"
              style={{ background: "rgba(17,16,8,0.9)", color: "var(--text-primary)" }}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">Platform</span>
            <select 
              value={selectedPlatform} 
              onChange={e => setSelectedPlatform(e.target.value)}
              className="text-input"
              style={{ background: "rgba(17,16,8,0.9)", color: "var(--text-primary)" }}
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">Solved count (modules / questions)</span>
            <input 
              type="number" 
              placeholder="e.g. 3" 
              value={countInput}
              onChange={e => setCountInput(e.target.value)}
              className="text-input"
              min="1"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: "8px" }}
          >
            LOG WORK & EARN +15 XP
          </button>
        </form>
      </GlassCard>

      {/* Log History list */}
      <div>
        <h3 className="semibold text-sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "12px" }}>
          LOG HISTORY
        </h3>
        {techLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
            No technical study logs recorded yet.
          </div>
        ) : (
          <div className="flex-column" style={{ gap: "10px" }}>
            {techLogs.map(log => (
              <GlassCard key={log.id} style={{ padding: "12px 16px" }} className="flex-row-between">
                <div style={{ textAlign: "left" }}>
                  <h4 className="semibold text-sm" style={{ color: "var(--text-primary)" }}>{log.topic}</h4>
                  <p className="text-xs" style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                    {log.platform} • {log.count} solved
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="orange-accent semibold text-sm">+{log.xpEarned} XP</span>
                  <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "2px" }}>{log.dateString}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
