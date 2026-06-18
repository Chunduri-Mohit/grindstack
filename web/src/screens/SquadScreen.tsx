import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { localDb } from "../db/localDb";
import type { GroupMember } from "../db/localDb";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

export const SquadScreen: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<GroupMember[]>([]);
  const [squadIdInput, setSquadIdInput] = useState("");
  const [squadNameInput, setSquadNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCreatingNewSquad, setIsCreatingNewSquad] = useState(false);
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<GroupMember | null>(null);

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
      const updated = await localDb.joinSquad(cleanId, squadNameInput);
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
      <div className="flex flex-col justify-center items-center text-center py-20 px-6 min-h-[60vh]">
        <div className="glass-panel rounded-xl p-8 max-w-sm">
          <span className="text-4xl block mb-4">🔒</span>
          <h3 className="font-card-title text-card-title text-on-surface mb-2">Sign-in Required</h3>
          <p className="font-body text-body text-on-surface-variant mb-6">
            You need to be logged in to join squads, view leaderboard rankings, and sync with your team.
          </p>
        </div>
      </div>
    );
  }

  // Calculate collective average completion
  const collectiveCompletion = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, m) => acc + m.dailyCompletionPercentage, 0) / leaderboard.length)
    : 82;

  // Generate deterministic mock bar heights for chart
  const mockBars = Array.from({ length: 30 }, (_, i) => {
    const height = Math.floor(Math.sin((i + 5) / 3) * 25 + 65);
    const opacity = height > 80 ? 'bg-primary' : 'bg-primary/30';
    const isToday = i === 28;
    return (
      <div key={i} className="flex flex-col justify-end items-center flex-shrink-0 w-6 h-32 relative group">
        <div
          className={`w-4 rounded-t-sm ${opacity} transition-all duration-300 group-hover:bg-primary`}
          style={{ height: `${height}%` }}
        />
        {isToday && <div className="absolute bottom-[-16px] w-1 h-1 rounded-full bg-white animate-pulse" />}
      </div>
    );
  });

  return (
    <div className="space-y-stack-lg w-full">
      {/* Header Section */}
      <section>
        <h2 className="font-section text-section text-on-surface mb-stack-sm">Social Protocol</h2>
        <p className="font-body text-body text-on-surface-variant max-w-md">
          Synchronize discipline with elite performers. Track collective mission status and hold the line.
        </p>
      </section>

      {profile.currentGroupId ? (
        /* ACTIVE SQUAD LEADERBOARD & STATS */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Shared Protocol Card */}
          <div className="md:col-span-8 glass-panel rounded-xl p-[20px] flex flex-col justify-between relative overflow-hidden">
            {/* Subtle internal glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

            <div className="flex justify-between items-start mb-stack-md relative z-10">
              <div>
                <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-1 block">Active Mission</span>
                <h3 className="font-card-title text-card-title text-on-surface">{profile.currentGroupName}</h3>
                <span className="text-xs text-on-surface-variant block mt-1">ID: {profile.currentGroupId}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container/50 px-3 py-1 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Day 14/30</span>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Progress Track */}
              <div>
                <div className="flex justify-between font-label-caps text-label-caps mb-2">
                  <span className="text-on-surface-variant">Collective Completion</span>
                  <span className="text-primary">{collectiveCompletion}%</span>
                </div>
                <div className="h-1 bg-primary/10 rounded-full overflow-hidden w-full relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 shadow-[0_0_8px_#d0bcff]"
                    style={{ width: `${collectiveCompletion}%` }}
                  ></div>
                </div>
              </div>

              {/* Squad Avatars */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-3">
                  {leaderboard.slice(0, 3).map((member, i) => (
                    <div
                      key={member.userId}
                      className="w-10 h-10 rounded-full border-2 border-background bg-surface-container flex items-center justify-center overflow-hidden"
                      style={{ zIndex: 10 - i }}
                    >
                      <span className="text-xl">
                        {member.profilePic === "avatar_1" ? "🧑‍💻" : member.profilePic === "avatar_2" ? "🦁" : member.profilePic === "avatar_3" ? "🥋" : "🚀"}
                      </span>
                    </div>
                  ))}
                  {leaderboard.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-background bg-surface-container flex items-center justify-center font-label-caps text-label-caps text-on-surface-variant">
                      +{leaderboard.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => alert("Shared connection check sent to all members!")}
                    className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-label-caps text-label-caps px-4 py-2 rounded-full border border-primary/20 flex items-center gap-2 text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    ENGAGE
                  </button>
                  <button
                    onClick={handleLeaveSquad}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-label-caps text-label-caps px-3 py-2 rounded-full border border-red-500/20 text-xs"
                  >
                    LEAVE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Elite Circles Leaderboard */}
          <div className="md:col-span-4 glass-panel rounded-xl p-[20px] flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
              <h3 className="font-card-title text-card-title text-on-surface">Elite Circles</h3>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {leaderboard.map((member, index) => {
                const isMe = member.isMe;
                const rank = String(index + 1).padStart(2, '0');
                return (
                  <div
                    key={member.userId}
                    onClick={() => setSelectedPlayerForDetails(member)}
                    className={`flex items-center justify-between p-3 rounded-lg bg-surface-container/30 border border-white/5 hover:border-white/10 transition-colors cursor-pointer ${
                      isMe ? 'border-primary/30 bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-label-caps text-label-caps w-4 ${isMe ? 'text-primary' : 'text-on-surface-variant'}`}>{rank}</span>
                      <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center font-label-caps text-label-caps">
                        {member.profilePic === "avatar_1" ? "🧑‍💻" : member.profilePic === "avatar_2" ? "🦁" : member.profilePic === "avatar_3" ? "🥋" : "🚀"}
                      </div>
                      <span className={`font-body text-body font-medium text-xs truncate max-w-[80px] ${isMe ? 'text-primary' : 'text-on-surface'}`}>
                        {member.username}
                      </span>
                    </div>
                    <span className={`font-label-caps text-label-caps text-xs ${
                      isMe
                        ? 'text-primary'
                        : index === 0 ? 'text-tertiary-container' : 'text-on-surface-variant'
                    }`}>
                      {member.dailyCompletionPercentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consistency Chart Area */}
          <div className="md:col-span-12 glass-panel rounded-xl p-[20px] mt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-card-title text-card-title text-on-surface">Protocol Integrity (Team)</h3>
              <div className="flex gap-2 items-center">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Completed</span>
              </div>
            </div>
            {/* Abstract Representation of a chart using grid blocks */}
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-2">
              {mockBars}
            </div>
          </div>
        </div>
      ) : (
        /* SQUAD JOIN / CREATE FORM */
        <div className="flex flex-col gap-6 max-w-md mx-auto">
          {/* Toggle Tab Bar */}
          <div className="flex bg-surface-container/50 border border-white/5 rounded-xl p-1 gap-1">
            <button
              className={`flex-1 py-2 text-center text-xs font-label-caps rounded-lg transition-all ${
                !isCreatingNewSquad
                  ? "bg-primary text-on-primary shadow-lg"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => setIsCreatingNewSquad(false)}
            >
              JOIN SQUAD
            </button>
            <button
              className={`flex-1 py-2 text-center text-xs font-label-caps rounded-lg transition-all ${
                isCreatingNewSquad
                  ? "bg-primary text-on-primary shadow-lg"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => setIsCreatingNewSquad(true)}
            >
              CREATE SQUAD
            </button>
          </div>

          {/* Form Card */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">
                {isCreatingNewSquad ? "storefront" : "group_add"}
              </span>
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase">
                {isCreatingNewSquad ? "CREATE NEW SQUAD" : "JOIN SQUAD SYNC"}
              </span>
            </div>

            {isCreatingNewSquad ? (
              <form onSubmit={handleCreateSquad} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Squad Name</label>
                  <input
                    type="text"
                    placeholder="e.g. FAANG 10x Grinders"
                    value={squadNameInput}
                    onChange={e => setSquadNameInput(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-3 text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary focus:bg-white/[0.04] transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary font-section py-3 rounded-full relative overflow-hidden transition-transform duration-300 hover:scale-[1.02] shadow-[0_0_24px_rgba(208,188,255,0.2)] text-sm mt-4"
                  disabled={loading}
                >
                  {loading ? "CREATING..." : "INITIATE SQUAD"}
                </button>

                <p className="text-xs text-on-surface-variant/60 leading-relaxed mt-4">
                  💡 Pro Tip: Creating a squad generates a unique Magic Link you can share with your team.
                </p>
              </form>
            ) : (
              <form onSubmit={handleJoinSquad} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Invite Link / ID</label>
                  <input
                    type="text"
                    placeholder="grindstack.app/hub-xplqrs1"
                    value={squadIdInput}
                    onChange={e => setSquadIdInput(e.target.value)}
                    onPaste={handlePaste}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-3 text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary focus:bg-white/[0.04] transition-all text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary font-section py-3 rounded-full relative overflow-hidden transition-transform duration-300 hover:scale-[1.02] shadow-[0_0_24px_rgba(208,188,255,0.2)] text-sm mt-4"
                  disabled={loading}
                >
                  {loading ? "JOINING..." : "JOIN SQUAD"}
                </button>

                <p className="text-xs text-on-surface-variant/60 leading-relaxed mt-4">
                  🔗 Paste an invite link or squad ID code to join their tribe sync.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL MEMBER INSPECT POPUP */}
      {selectedPlayerForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-xl max-w-sm w-full p-6 space-y-6 relative">
            <button
              onClick={() => setSelectedPlayerForDetails(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                {selectedPlayerForDetails.profilePic === "avatar_1" ? "🧑‍💻" : selectedPlayerForDetails.profilePic === "avatar_2" ? "🦁" : selectedPlayerForDetails.profilePic === "avatar_3" ? "🥋" : "🚀"}
              </div>
              <div>
                <h4 className="font-card-title text-card-title text-on-surface">
                  {selectedPlayerForDetails.username}
                </h4>
                <p className="text-xs text-on-surface-variant">Active Squad Member</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <div>
                <span className="block text-[10px] font-label-caps text-on-surface-variant uppercase">Done</span>
                <span className="text-sm font-semibold text-primary">{selectedPlayerForDetails.dailyCompletionPercentage}%</span>
              </div>
              <div>
                <span className="block text-[10px] font-label-caps text-on-surface-variant uppercase">Streak</span>
                <span className="text-sm font-semibold text-primary">⚡ {selectedPlayerForDetails.currentStreak}d</span>
              </div>
              <div>
                <span className="block text-[10px] font-label-caps text-on-surface-variant uppercase">XP</span>
                <span className="text-sm font-semibold text-primary">{selectedPlayerForDetails.xp}</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">Completed Tasks Today:</span>
              <div className="space-y-2 max-h-[140px] overflow-y-auto">
                {selectedPlayerForDetails.activeBreakdown ? (
                  selectedPlayerForDetails.activeBreakdown.split(",").filter(t => t.trim() !== "").map((taskName, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      <span>{taskName.trim()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant italic py-2">No tasks logged today</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
