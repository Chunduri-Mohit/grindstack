import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { GroupMember } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

export const SquadScreen: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<GroupMember[]>([]);
  const [squadIdInput, setSquadIdInput] = useState("");
  const [squadNameInput, setSquadNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCreatingNewSquad, setIsCreatingNewSquad] = useState(false);

  // Subscribing to Firestore real-time leaderboard updates
  useEffect(() => {
    if (!profile.currentGroupId) {
      setLeaderboard([]);
      return;
    }

    setLoading(true);
    // Seed initial list with local cache
    setLeaderboard(localDb.getLeaderboardCache());

    // Subscribe to Firestore collection
    const unsub = onSnapshot(
      collection(db, "squads", profile.currentGroupId, "members"),
      (snapshot) => {
        const members: GroupMember[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<GroupMember, "userId" | "isMe">;
          members.push({
            ...data,
            userId: doc.id,
            isMe: user ? doc.id === user.uid : false
          });
        });
        
        // Sort by dailyCompletionPercentage desc, then XP desc, then currentStreak desc
        members.sort((a, b) => {
          if (b.dailyCompletionPercentage !== a.dailyCompletionPercentage) {
            return b.dailyCompletionPercentage - a.dailyCompletionPercentage;
          }
          if (b.xp !== a.xp) return b.xp - a.xp;
          return b.currentStreak - a.currentStreak;
        });

        setLeaderboard(members);
        localDb.saveLeaderboardCache(members);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [profile.currentGroupId, user]);

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadIdInput.trim()) return;

    try {
      setLoading(true);
      const cleanId = localDb.extractSquadId(squadIdInput);
      const updated = await localDb.joinSquad(cleanId, squadNameInput || "Squad Tribe");
      await refreshProfile();
      setSquadIdInput("");
      setSquadNameInput("");
      alert(`Joined squad: ${updated.currentGroupName}!`);
    } catch (err) {
      console.error(err);
      alert("Failed to join squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = squadNameInput.trim() || "Standard Grinding Corps";
    const id = `hub-${name.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      setLoading(true);
      await localDb.joinSquad(id, name);
      await refreshProfile();
      setSquadNameInput("");
      alert(`Squad "${name}" created! Share the magic link with your team.`);
    } catch (err) {
      console.error(err);
      alert("Failed to create squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (window.confirm("Are you sure you want to leave this squad?")) {
      try {
        setLoading(true);
        await localDb.leaveSquad();
        await refreshProfile();
        setLeaderboard([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Clipboard Paste Helper to parse magic invite link
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const parsedId = localDb.extractSquadId(pastedText);
    if (parsedId !== pastedText) {
      e.preventDefault();
      setSquadIdInput(parsedId);
    }
  };

  if (!user) {
    return (
      <div className="screen-content" style={{ justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
        <GlassCard>
          <span style={{ fontSize: "36px" }}>🔒</span>
          <h3 className="bold text-md" style={{ marginTop: "12px", marginBottom: "8px" }}>Sign-in Required</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
            You need to be logged in to join squads, view leaderboard rankings, and sync with your team.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="screen-content">
      {/* Title */}
      <div>
        <h2 className="bold" style={{ fontSize: "22px" }}>SQUAD TRIBES</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
          Join shared hubs via magic links and sync task streaks live with your peers.
        </p>
      </div>

      {profile.currentGroupId ? (
        // ACTIVE SQUAD LEADERBOARD
        <div className="flex-column" style={{ gap: "20px" }}>
          <GlassCard className="flex-row-between">
            <div>
              <p className="text-xs" style={{ textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>Active Squad</p>
              <h3 className="semibold text-md orange-accent" style={{ marginTop: "4px" }}>{profile.currentGroupName}</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "2px" }}>ID: {profile.currentGroupId}</p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleLeaveSquad}>
              LEAVE
            </button>
          </GlassCard>

          <div>
            <h3 className="semibold text-sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              Tribe Leaderboard {loading && "..."}
            </h3>

            <div className="leaderboard-list">
              {leaderboard.map((member, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;

                const getRankClass = () => {
                  if (isFirst) return "leaderboard-rank leaderboard-rank-1";
                  if (isSecond) return "leaderboard-rank leaderboard-rank-2";
                  if (isThird) return "leaderboard-rank leaderboard-rank-3";
                  return "leaderboard-rank";
                };

                return (
                  <GlassCard 
                    key={member.userId} 
                    style={{ 
                      padding: "12px 14px", 
                      border: member.isMe ? "1.5px solid var(--accent-orange)" : "1px solid var(--card-border)",
                      background: member.isMe ? "rgba(251, 146, 60, 0.02)" : "var(--card-bg)"
                    }}
                    className="flex-row-between"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left", flex: 1, minWidth: 0 }}>
                      <span className={getRankClass()}>
                        {index + 1}
                      </span>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px"
                      }}>
                        {member.profilePic === "avatar_1" ? "🧑‍💻" : member.profilePic === "avatar_2" ? "🦁" : member.profilePic === "avatar_3" ? "🥋" : "🚀"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 className="semibold text-sm" style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {member.username} {member.isMe && <span className="orange-accent text-xs">(You)</span>}
                        </h4>
                        <p className="text-xs" style={{ color: "var(--text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {member.activeBreakdown ? `Completed: ${member.activeBreakdown}` : "No tasks done today"}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", paddingLeft: "10px" }}>
                      <span className="bold text-sm green-accent">{member.dailyCompletionPercentage}%</span>
                      <div style={{ display: "flex", gap: "6px", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", justifyContent: "flex-end" }}>
                        <span>🔥 {member.currentStreak}d</span>
                        <span>•</span>
                        <span>{member.xp} XP</span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // SQUAD JOIN / CREATE FORM
        <div className="flex-column" style={{ gap: "12px" }}>
          {/* Toggle Tab Bar */}
          <div className="toggle-tab-bar">
            <button 
              className={`toggle-tab ${!isCreatingNewSquad ? "active" : ""}`}
              onClick={() => setIsCreatingNewSquad(false)}
            >
              JOIN SQUAD
            </button>
            <button 
              className={`toggle-tab ${isCreatingNewSquad ? "active" : ""}`}
              onClick={() => setIsCreatingNewSquad(true)}
            >
              CREATE SQUAD
            </button>
          </div>

          {/* Form Card */}
          <GlassCard>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <span style={{ fontSize: "20px" }}>
                {isCreatingNewSquad ? "🏪" : "👥"}
              </span>
              <span className="text-sm semibold" style={{ 
                textTransform: "uppercase", 
                letterSpacing: "1px", 
                color: "var(--text-secondary)",
                fontSize: "11px"
              }}>
                {isCreatingNewSquad ? "CREATE NEW SQUAD" : "JOIN SQUAD SYNC"}
              </span>
            </div>

            {isCreatingNewSquad ? (
              <form onSubmit={handleCreateSquad} className="flex-column">
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="Squad Name" 
                    value={squadNameInput}
                    onChange={e => setSquadNameInput(e.target.value)}
                    className="text-input"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: "100%", marginTop: "10px" }}
                  disabled={loading}
                >
                  {loading ? "CREATING..." : "INITIATE SQUAD"}
                </button>

                <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "14px" }}>
                  💡 Pro Tip: Creating a squad generates a unique Magic Link you can share with your team.
                </p>
              </form>
            ) : (
              <form onSubmit={handleJoinSquad} className="flex-column">
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="Invite Link / Magic Connection String" 
                    value={squadIdInput}
                    onChange={e => setSquadIdInput(e.target.value)}
                    onPaste={handlePaste}
                    className="text-input"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: "100%", marginTop: "10px" }}
                  disabled={loading}
                >
                  {loading ? "JOINING..." : "JOIN SQUAD"}
                </button>

                <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "14px" }}>
                  🔗 Paste an invite link from a squad member to join their tribe.
                </p>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};
