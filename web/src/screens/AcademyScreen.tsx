import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { TechLog } from "../db/localDb";
import { TimeInput } from "../components/TimeInput";

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
  const [selectedSubject, setSelectedSubject] = useState("Problem Solving");
  const [selectedPlatform, setSelectedPlatform] = useState("LeetCode");

  // Custom Slider and Calibration States
  const [solvedCount, setSolvedCount] = useState(3); // default 3 problems
  const [startTime, setStartTime] = useState("05:30");
  const [endTime, setEndTime] = useState("07:00");

  useEffect(() => {
    setTechLogs(localDb.getTechLogs());
  }, []);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLog = localDb.addTechLog(selectedSubject, selectedPlatform, solvedCount);
    setTechLogs([newLog, ...techLogs]);
    await refreshProfile();
    alert(`Logged ${solvedCount} problems in ${selectedSubject}! +${solvedCount * 15} XP added.`);
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

  const getIntensityLabel = (val: number) => {
    if (val <= 2) return "Routine";
    if (val <= 5) return "Moderate";
    if (val <= 8) return "High";
    return "Absolute";
  };

  return (
    <div className="space-y-stack-lg w-full pb-20">
      {/* Header Section */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="font-section text-section text-on-surface">Mission Architect</h2>
        <p className="font-body text-body text-on-surface-variant">
          Design your protocol. Precision yields progress. Log problems solved to earn 15 XP each.
        </p>
      </section>

      {/* Bento Subject Selection */}
      <section className="flex flex-col gap-stack-md">
        <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Select Directive</h3>
        <div className="grid grid-cols-2 gap-gutter">
          {/* Card 1: Problem Solving */}
          <div
            onClick={() => setSelectedSubject("Problem Solving")}
            className={`glass-panel rounded-xl p-[16px] flex flex-col gap-stack-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedSubject === "Problem Solving" ? "glass-panel-active" : ""
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              selectedSubject === "Problem Solving" ? "bg-primary/20 text-primary" : "bg-surface-variant text-on-surface-variant"
            }`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <h4 className="font-card-title text-sm text-on-surface font-semibold">Deep Work</h4>
            <p className="font-label-caps text-[10px] text-on-surface-variant">Problem Solving</p>
          </div>

          {/* Card 2: Striver's DSA Sheet */}
          <div
            onClick={() => setSelectedSubject("Striver's DSA Sheet")}
            className={`glass-panel rounded-xl p-[16px] flex flex-col gap-stack-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedSubject === "Striver's DSA Sheet" ? "glass-panel-active" : ""
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              selectedSubject === "Striver's DSA Sheet" ? "bg-primary/20 text-primary" : "bg-surface-variant text-on-surface-variant"
            }`}>
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <h4 className="font-card-title text-sm text-on-surface font-semibold">Striver's DSA</h4>
            <p className="font-label-caps text-[10px] text-on-surface-variant">Standard Grid Sheet</p>
          </div>

          {/* Card 3: Web Dev */}
          <div
            onClick={() => setSelectedSubject("Web Dev")}
            className={`glass-panel rounded-xl p-[16px] flex flex-col gap-stack-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] col-span-2 ${
              selectedSubject === "Web Dev" ? "glass-panel-active" : ""
            }`}
          >
            <div className="flex items-center gap-gutter">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedSubject === "Web Dev" ? "bg-primary/20 text-primary" : "bg-surface-variant text-on-surface-variant"
              }`}>
                <span className="material-symbols-outlined">code</span>
              </div>
              <div>
                <h4 className="font-card-title text-sm text-on-surface font-semibold">Web Development</h4>
                <p className="font-label-caps text-[10px] text-on-surface-variant">Read, Learn, Synthesize</p>
              </div>
            </div>
          </div>
        </div>

        {/* Small dropdown selection fallback for remaining subjects */}
        <div className="flex gap-2 items-center bg-surface-container/30 border border-white/5 p-2 rounded-xl">
          <span className="text-xs text-on-surface-variant font-label-caps px-2">Other Directive:</span>
          <select
            value={SUBJECTS.includes(selectedSubject) ? selectedSubject : "Problem Solving"}
            onChange={e => setSelectedSubject(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface outline-none border-none cursor-pointer"
          >
            {SUBJECTS.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
          </select>
        </div>
      </section>

      {/* Platform Pill Selector */}
      <section className="flex flex-col gap-stack-sm">
        <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Target Platform</h3>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`px-4 py-2 rounded-full font-label-caps text-xs border transition-all ${
                selectedPlatform === p
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-surface-container-low/40 text-on-surface-variant border-white/5 hover:bg-white/5"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Calibration Form Card */}
      <form onSubmit={handleLogSubmit} className="space-y-6">
        <section className="flex flex-col gap-stack-md glass-panel rounded-xl p-[20px]">
          <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-2">Calibration</h3>

          {/* Solved Count Slider (Mapped as Intensity) */}
          <div className="flex flex-col gap-stack-sm mb-4">
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-on-surface">Target Solved Count</span>
              <span className="font-card-title text-card-title text-primary font-semibold">
                {solvedCount} {solvedCount === 1 ? "Problem" : "Problems"} ({getIntensityLabel(solvedCount)})
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={solvedCount}
              onChange={e => setSolvedCount(Number(e.target.value))}
              className="w-full appearance-none bg-white/10 h-1 rounded-lg outline-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] font-label-caps text-on-surface-variant opacity-60 mt-1">
              <span>Routine (1)</span>
              <span>Absolute (10)</span>
            </div>
          </div>

          {/* Time Allocation */}
          <div className="flex flex-col gap-stack-sm">
            <span className="font-body text-sm text-on-surface">Time Allocation</span>
            <div className="flex gap-gutter">
              <TimeInput
                label="START"
                value={startTime}
                onChange={setStartTime}
                variant="compact"
              />
              <TimeInput
                label="END"
                value={endTime}
                onChange={setEndTime}
                variant="compact"
              />
            </div>
          </div>
        </section>

        {/* Projected Impact */}
        <section className="flex flex-col gap-stack-md glass-panel rounded-xl p-[20px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Projected Impact</h3>
            <span className="font-label-caps text-label-caps text-tertiary-container">+{solvedCount * 15} XP</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-on-surface-variant">Subject Progression</span>
              <span className="font-body text-sm text-on-surface">
                {getSubjectProgress(selectedSubject).count} → <span className="text-primary font-section text-lg ml-1">{getSubjectProgress(selectedSubject).count + solvedCount}</span>
              </span>
            </div>

            {/* Progress Track */}
            <div className="h-1 bg-primary/10 rounded-full overflow-hidden w-full relative mt-2">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, ((getSubjectProgress(selectedSubject).count + solvedCount) / (SUBJECT_TARGETS[selectedSubject] || 40)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Commit Button */}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary font-section py-4 rounded-full relative overflow-hidden transition-transform duration-300 hover:scale-[1.02] shadow-[0_0_24px_rgba(208,188,255,0.2)] text-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
          Commit Mission
        </button>
      </form>

      {/* Log History */}
      <section className="space-y-4">
        <h3 className="font-label-caps text-label-caps text-outline uppercase tracking-wider px-1">Log History</h3>

        {techLogs.length === 0 ? (
          <div className="glass-panel rounded-xl p-8 text-center text-xs text-on-surface-variant/40">
            No technical study logs recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {techLogs.map(log => (
              <div key={log.id} className="glass-panel rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-body text-sm text-on-surface font-semibold">{log.topic}</h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {log.platform} • {log.count} problems solved
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-primary font-semibold text-sm">+{log.xpEarned} XP</span>
                  <p className="text-[10px] text-on-surface-variant mt-1">{log.dateString}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
