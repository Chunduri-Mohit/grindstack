import React, { useMemo, useState } from "react";
import { useAuth } from "../context/useAuth";
import { localDb, getTodayDateString } from "../db/localDb";
import type { TechLog } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";

type SubjectInfo = {
  key: string;
  title: string;
  icon: string;
  target: number;
};

const SUBJECTS: SubjectInfo[] = [
  { key: "Problem Solving", title: "DSA", icon: "auto_stories", target: 200 },
  { key: "Striver's DSA Sheet", title: "Striver", icon: "menu_book", target: 450 },
  { key: "Web Dev", title: "Web Dev", icon: "code", target: 100 },
  { key: "Python", title: "Python", icon: "terminal", target: 60 },
  { key: "Java", title: "Java", icon: "coffee", target: 60 },
  { key: "CRT", title: "CRT", icon: "calculate", target: 120 }
];

function defaultPlatformFor(subject: string): string {
  if (subject === "Problem Solving") return "LeetCode";
  if (subject === "Striver's DSA Sheet") return "Striver's Sheet";
  if (subject === "CRT") return "Smart Interviews";
  return subject;
}

function resolveSubject(topic: string, platform: string): string {
  const topicLower = topic.toLowerCase().trim();
  const platformLower = platform.toLowerCase().trim();

  if (topicLower.includes("striver") || platformLower.includes("striver") || platformLower.includes("sheet")) return "Striver's DSA Sheet";
  if (topicLower.includes("crt") || topicLower.includes("smart") || topicLower.includes("interview") || platformLower.includes("smart") || platformLower.includes("interview")) return "CRT";
  if (topicLower.includes("web") || topicLower.includes("html") || topicLower.includes("css") || topicLower.includes("js") || topicLower.includes("javascript") || topicLower.includes("react") || topicLower.includes("node") || platformLower.includes("web")) return "Web Dev";
  if (topicLower.includes("python") || topicLower.includes("django") || topicLower.includes("flask") || topicLower.includes("numpy") || topicLower.includes("pandas") || topicLower.includes("py") || platformLower.includes("python")) return "Python";
  if ((topicLower.includes("java") && !topicLower.includes("javascript") && !topicLower.includes("js")) || platformLower.includes("java")) return "Java";
  if (topicLower.includes("problem") || topicLower.includes("solving") || topicLower.includes("dsa") || topicLower.includes("leetcode") || topicLower.includes("codechef") || platformLower.includes("leetcode") || platformLower.includes("codechef")) return "Problem Solving";

  return SUBJECTS.find(subject => subject.key.toLowerCase() === topicLower || subject.title.toLowerCase() === topicLower)?.key ?? "Problem Solving";
}

function dateDaysAgo(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

export const AcademyScreen: React.FC = () => {
  const { refreshProfile } = useAuth();
  const [techLogs, setTechLogs] = useState<TechLog[]>(() => localDb.getTechLogs());
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].key);
  const [solvedCount, setSolvedCount] = useState(3);

  const todayString = getTodayDateString();
  const weekStart = dateDaysAgo(6);

  const totals = useMemo(() => {
    const bySubject = new Map<string, number>();
    SUBJECTS.forEach(subject => bySubject.set(subject.key, 0));

    let todaySolved = 0;
    let weekSolved = 0;
    let studyXp = 0;

    techLogs.forEach(log => {
      const subject = resolveSubject(log.topic, log.platform);
      bySubject.set(subject, (bySubject.get(subject) ?? 0) + log.count);
      studyXp += log.xpEarned;

      if (log.dateString === todayString) todaySolved += log.count;
      const parsedDate = new Date(`${log.dateString}T00:00:00`);
      if (!Number.isNaN(parsedDate.getTime()) && parsedDate >= weekStart) {
        weekSolved += log.count;
      }
    });

    return { bySubject, todaySolved, weekSolved, studyXp };
  }, [techLogs, todayString, weekStart]);

  const selectedInfo = SUBJECTS.find(subject => subject.key === selectedSubject) ?? SUBJECTS[0];

  const commitLog = async () => {
    const log = localDb.addTechLog(selectedSubject, defaultPlatformFor(selectedSubject), solvedCount);
    setTechLogs(localDb.getTechLogs());
    await refreshProfile();
    setSolvedCount(Math.max(1, log.count));
  };

  return (
    <div className="screen-content">
      <section className="screen-heading">
        <h2>Academy</h2>
        <p>Log study sessions and track progress.</p>
      </section>

      <GlassCard className="metric-strip">
        <Metric label="Today" value={totals.todaySolved} />
        <div className="metric-divider" />
        <Metric label="Week" value={totals.weekSolved} />
        <div className="metric-divider" />
        <Metric label="Study XP" value={totals.studyXp} />
      </GlassCard>

      <GlassCard className="flex-column" style={{ gap: 16 }}>
        <h3 className="section-title">Log study</h3>

        <div className="flex-column" style={{ gap: 8 }}>
          <p className="section-label">Subject</p>
          <div className="subject-grid">
            {SUBJECTS.map(subject => (
              <button
                key={subject.key}
                type="button"
                className={`subject-chip ${selectedSubject === subject.key ? "active" : ""}`}
                onClick={() => setSelectedSubject(subject.key)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">{subject.icon}</span>
                <span>{subject.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        <div className="stepper-row">
          <button
            className="stepper-button"
            type="button"
            disabled={solvedCount <= 1}
            onClick={() => setSolvedCount(count => Math.max(1, count - 1))}
            aria-label="Decrease problem count"
          >
            <span className="material-symbols-outlined" aria-hidden="true">remove</span>
          </button>
          <div className="stepper-value">
            <strong>{solvedCount}</strong>
            <span>{solvedCount === 1 ? "problem" : "problems"}</span>
          </div>
          <button
            className="stepper-button"
            type="button"
            disabled={solvedCount >= 12}
            onClick={() => setSolvedCount(count => Math.min(12, count + 1))}
            aria-label="Increase problem count"
          >
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
          </button>
        </div>

        <button className="btn btn-accent" type="button" onClick={commitLog}>
          Log {selectedInfo.title} +{solvedCount * 15} XP
        </button>
      </GlassCard>

      <h3 className="section-title">Subject progress</h3>
      <GlassCard className="progress-list">
        {SUBJECTS.map(subject => {
          const solved = totals.bySubject.get(subject.key) ?? 0;
          const progress = Math.min(100, (solved / subject.target) * 100);
          return (
            <div className="progress-row" key={subject.key}>
              <span className="row-icon">
                <span className="material-symbols-outlined" aria-hidden="true">{subject.icon}</span>
              </span>
              <div className="progress-copy">
                <div className="progress-copy-row">
                  <strong>{subject.title}</strong>
                  <span>{solved}/{subject.target}</span>
                </div>
                <div className="thin-track">
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </GlassCard>

      <div className="flex-row-between">
        <h3 className="section-title">Recent sessions</h3>
        {techLogs.length > 0 && <span className="text-xs">{techLogs.length} logged</span>}
      </div>

      {techLogs.length === 0 ? (
        <GlassCard style={{ padding: "28px 18px", textAlign: "center" }}>
          <p className="text-sm">No sessions yet. Log your first one above.</p>
        </GlassCard>
      ) : (
        <div className="flex-column" style={{ gap: 10 }}>
          {techLogs.slice(0, 10).map(log => {
            const subjectKey = resolveSubject(log.topic, log.platform);
            const subject = SUBJECTS.find(item => item.key === subjectKey) ?? SUBJECTS[0];
            return (
              <GlassCard className="log-row" key={log.id}>
                <div className="log-row" style={{ padding: 0, justifyContent: "flex-start", flex: 1, minWidth: 0 }}>
                  <span className="row-icon">
                    <span className="material-symbols-outlined" aria-hidden="true">{subject.icon}</span>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p className="log-row-title">{subject.title}</p>
                    <p className="log-row-subtitle">{log.count} solved</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="log-row-xp">+{log.xpEarned} XP</p>
                  <p className="text-xs">{log.dateString}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="metric-item">
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);
