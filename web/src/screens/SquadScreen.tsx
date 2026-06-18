import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/useAuth";
import { db } from "../firebase/config";
import { localDb } from "../db/localDb";
import type { GroupMember } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";

function avatarInitial(profilePic: string | undefined, username = ""): string {
  if (profilePic?.startsWith("http")) return username.trim().slice(0, 1).toUpperCase() || "G";
  const clean = username.trim();
  if (!clean) return "GS";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function sortLeaderboard(members: GroupMember[]): GroupMember[] {
  return [...members].sort((a, b) => {
    if (b.dailyCompletionPercentage !== a.dailyCompletionPercentage) {
      return b.dailyCompletionPercentage - a.dailyCompletionPercentage;
    }
    if (b.xp !== a.xp) return b.xp - a.xp;
    return b.currentStreak - a.currentStreak;
  });
}

export const SquadScreen: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<GroupMember[]>(() => (
    profile.currentGroupId ? sortLeaderboard(localDb.getLeaderboardCache()) : []
  ));
  const [groupLinkInput, setGroupLinkInput] = useState("");
  const [groupNameInput, setGroupNameInput] = useState("");
  const [isCreatingNewSquad, setIsCreatingNewSquad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joinLinkError, setJoinLinkError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<GroupMember | null>(null);

  useEffect(() => {
    if (!profile.currentGroupId) {
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "squads", profile.currentGroupId, "members"),
      snapshot => {
        const members: GroupMember[] = [];
        snapshot.forEach(document => {
          const data = document.data() as Omit<GroupMember, "userId" | "isMe">;
          members.push({
            ...data,
            userId: document.id,
            isMe: user ? document.id === user.uid : false
          });
        });

        const sorted = sortLeaderboard(members);
        setLeaderboard(sorted);
        localDb.saveLeaderboardCache(sorted);
        setLoading(false);
      },
      error => {
        console.error("Firestore squad sync failed", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile.currentGroupId, user]);

  const joinSquad = async () => {
    if (!groupLinkInput.trim()) {
      setJoinLinkError("Invite link is required.");
      return;
    }

    try {
      setLoading(true);
      setJoinLinkError(null);
      await localDb.joinSquad(groupLinkInput.trim(), groupLinkInput.trim());
      await refreshProfile();
      setGroupLinkInput("");
    } finally {
      setLoading(false);
    }
  };

  const createSquad = async () => {
    const name = groupNameInput.trim() || "Standard Grinding Corps";
    const id = `hub-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      setLoading(true);
      await localDb.joinSquad(id, name);
      await refreshProfile();
      setGroupNameInput("");
    } finally {
      setLoading(false);
    }
  };

  const leaveSquad = async () => {
    try {
      setLoading(true);
      await localDb.leaveSquad();
      await refreshProfile();
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = async () => {
    const text = `Join my Squad: ${profile.currentGroupName ?? "Squad"} (ID: ${profile.currentGroupId ?? ""})`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  const collectivePct = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((sum, member) => sum + member.dailyCompletionPercentage, 0) / leaderboard.length)
    : 0;

  return (
    <div className="screen-content">
      <section className="screen-heading">
        <h2>Squad</h2>
        <p>Grind together. Hold the line.</p>
      </section>

      {!profile.currentGroupId ? (
        <>
          <section className="squad-empty">
            <span className="squad-empty-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 38 }} aria-hidden="true">groups</span>
            </span>
            <h3 className="section-title">You're solo right now</h3>
            <p className="text-sm">Join a squad or start your own to compete on a live leaderboard.</p>
          </section>

          <div className="segmented-control">
            <button
              type="button"
              className={!isCreatingNewSquad ? "active" : ""}
              onClick={() => setIsCreatingNewSquad(false)}
            >
              Join
            </button>
            <button
              type="button"
              className={isCreatingNewSquad ? "active" : ""}
              onClick={() => setIsCreatingNewSquad(true)}
            >
              Create
            </button>
          </div>

          <GlassCard className="flex-column" style={{ gap: 16 }}>
            {isCreatingNewSquad ? (
              <div className="input-group">
                <label className="input-label" htmlFor="squad-name">Squad name</label>
                <input
                  id="squad-name"
                  className="text-input"
                  value={groupNameInput}
                  onChange={event => setGroupNameInput(event.target.value)}
                  placeholder="e.g. FAANG 10x Grinders"
                />
              </div>
            ) : (
              <div className="input-group">
                <label className="input-label" htmlFor="squad-link">Invite code / link</label>
                <input
                  id="squad-link"
                  className="text-input"
                  value={groupLinkInput}
                  onChange={event => {
                    setGroupLinkInput(event.target.value);
                    setJoinLinkError(null);
                  }}
                  onPaste={event => {
                    const pasted = event.clipboardData.getData("text");
                    const parsed = localDb.extractSquadId(pasted);
                    if (parsed !== pasted) {
                      event.preventDefault();
                      setGroupLinkInput(parsed);
                    }
                  }}
                  placeholder="grindstack.app/hub-xplqrs1"
                />
                {joinLinkError && <p className="text-xs" style={{ color: "var(--danger)" }}>{joinLinkError}</p>}
              </div>
            )}

            <button
              className="btn btn-accent"
              type="button"
              disabled={loading}
              onClick={isCreatingNewSquad ? createSquad : joinSquad}
            >
              {loading ? "Working..." : isCreatingNewSquad ? "Create squad" : "Join squad"}
            </button>

            <p className="text-xs">
              {isCreatingNewSquad
                ? "Creating a squad generates a unique link you can share with your team."
                : "Paste an invite link from a squad member to join their tribe."}
            </p>
          </GlassCard>
        </>
      ) : (
        <>
          <section className="aurora-card squad-hero">
            <div className="squad-hero-top">
              <div>
                <p className="section-label" style={{ color: "var(--accent-lime)" }}>Active squad</p>
                <h3 className="section-title">{profile.currentGroupName ?? "Squad Tribe"}</h3>
                <p className="text-xs">ID: {profile.currentGroupId}</p>
              </div>
              <span className="squad-member-pill">
                <span className="squad-member-dot" />
                {leaderboard.length} members
              </span>
            </div>

            <div>
              <div className="flex-row-between" style={{ marginBottom: 8 }}>
                <span className="text-sm">Collective completion</span>
                <strong className="lime-accent">{collectivePct}%</strong>
              </div>
              <div className="thin-track">
                <div style={{ width: `${collectivePct}%` }} />
              </div>
            </div>

            <div className="flex-row-between">
              <div className="avatar-stack">
                {leaderboard.slice(0, 4).map(member => (
                  <span className="avatar-bubble" key={member.userId}>
                    {avatarInitial(member.profilePic, member.username)}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" type="button" onClick={copyInvite}>
                  <span className="material-symbols-outlined" aria-hidden="true">share</span>
                  Invite
                </button>
                <button className="btn btn-secondary btn-icon-only" type="button" onClick={leaveSquad} disabled={loading} aria-label="Leave squad">
                  <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                </button>
              </div>
            </div>
          </section>

          <GlassCard className="flex-column" style={{ gap: 10 }}>
            <div className="log-row" style={{ justifyContent: "flex-start", padding: 0 }}>
              <span className="material-symbols-outlined lime-accent" aria-hidden="true">emoji_events</span>
              <h3 className="section-title">Leaderboard</h3>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm" style={{ padding: "18px 0", textAlign: "center" }}>
                {loading ? "Syncing squad..." : "No squad data synced yet."}
              </p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((member, index) => (
                  <button
                    type="button"
                    key={member.userId}
                    className={`leaderboard-row ${member.isMe ? "me" : ""}`}
                    onClick={() => setSelectedPlayer(member)}
                  >
                    <div className="log-row" style={{ padding: 0, justifyContent: "flex-start", minWidth: 0 }}>
                      <span className="leaderboard-rank">{String(index + 1).padStart(2, "0")}</span>
                      <span className="avatar-bubble" style={{ marginLeft: 0, width: 32, height: 32, borderWidth: 0 }}>
                        {avatarInitial(member.profilePic, member.username)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p className="leaderboard-name">{member.username}{member.isMe ? " (you)" : ""}</p>
                        <p className="leaderboard-subtitle">{member.xp} XP</p>
                      </div>
                    </div>
                    <strong className="lime-accent">{Math.round(member.dailyCompletionPercentage)}%</strong>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="flex-column" style={{ gap: 16 }}>
            <div>
              <h3 className="section-title">Team completion</h3>
              <p className="text-xs">Today's completion by squad member</p>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm" style={{ textAlign: "center", padding: "24px 0" }}>No squad data synced yet.</p>
            ) : (
              <div className="team-chart hide-scrollbar">
                {leaderboard.map(member => {
                  const pct = Math.max(0, Math.min(100, member.dailyCompletionPercentage));
                  return (
                    <div className="team-bar-item" key={member.userId}>
                      <div className="team-bar-track">
                        <div className="team-bar" style={{ height: `${pct}%`, opacity: pct >= 80 ? 1 : 0.45 }} />
                      </div>
                      <span className="avatar-bubble" style={{ marginLeft: 0, width: 28, height: 28, borderWidth: 0 }}>
                        {avatarInitial(member.profilePic, member.username)}
                      </span>
                      <span className="text-xs">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </>
      )}

      {selectedPlayer && (
        <div className="dashboard-modal-backdrop">
          <GlassCard className="dashboard-modal-card">
            <div className="log-row" style={{ justifyContent: "flex-start", padding: 0 }}>
              <span className="avatar-bubble" style={{ marginLeft: 0, width: 40, height: 40, borderWidth: 0 }}>
                {avatarInitial(selectedPlayer.profilePic, selectedPlayer.username)}
              </span>
              <h3>{selectedPlayer.username}</h3>
            </div>

            <div className="metric-strip glass-panel" style={{ padding: 14, boxShadow: "none" }}>
              <Metric label="Today" value={`${Math.round(selectedPlayer.dailyCompletionPercentage)}%`} />
              <div className="metric-divider" />
              <Metric label="Streak" value={`${selectedPlayer.currentStreak}d`} />
              <div className="metric-divider" />
              <Metric label="XP" value={`${selectedPlayer.xp}`} />
            </div>

            <div className="flex-column" style={{ gap: 8 }}>
              <p className="section-label">Completed today</p>
              {selectedPlayer.activeBreakdown.split(",").filter(Boolean).length === 0 ? (
                <p className="text-sm">Nothing logged yet today.</p>
              ) : (
                selectedPlayer.activeBreakdown.split(",").filter(Boolean).map(taskName => (
                  <div className="log-row" key={taskName} style={{ justifyContent: "flex-start", padding: 0 }}>
                    <span className="material-symbols-outlined lime-accent" aria-hidden="true">check_circle</span>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{taskName.trim()}</span>
                  </div>
                ))
              )}
            </div>

            <button className="btn btn-accent" type="button" onClick={() => setSelectedPlayer(null)}>Close</button>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="metric-item">
    <strong style={{ fontSize: 18 }}>{value}</strong>
    <span>{label}</span>
  </div>
);
