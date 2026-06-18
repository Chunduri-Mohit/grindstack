import React from "react";
import { useAuth } from "../context/useAuth";
import { GlassCard } from "../components/GlassCard";

const FEATURES = [
  {
    icon: "target",
    title: "Daily Checklists & Heatmaps",
    text: "Track your tasks and watch your streak grow. Consistency is key."
  },
  {
    icon: "auto_stories",
    title: "Academy Study Mode",
    text: "Log study sessions, trace topics, and earn skill XP points."
  },
  {
    icon: "groups",
    title: "Squads",
    text: "Join squads with clean invite codes and compete on the live leaderboard."
  }
];

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isFirebaseConfigured, loginAsGuest } = useAuth();

  return (
    <div className="screen-content" style={{ padding: "34px 20px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div className="login-mark">
          <span className="material-symbols-outlined" style={{ fontSize: 34 }} aria-hidden="true">bolt</span>
        </div>
        <h1 className="login-logo">GRINDSTACK</h1>
        <p className="text-md" style={{ color: "var(--text-secondary)", marginTop: "6px" }}>
          Reclaim your focus. Track, study, recover, and grow.
        </p>
      </div>

      <div className="flex-column" style={{ gap: "12px", marginBottom: "24px" }}>
        {FEATURES.map(feature => (
          <GlassCard key={feature.title}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span className="login-feature-icon">
                <span className="material-symbols-outlined" aria-hidden="true">{feature.icon}</span>
              </span>
              <div style={{ textAlign: "left" }}>
                <h3 className="semibold text-md">{feature.title}</h3>
                <p className="text-sm">{feature.text}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex-column" style={{ gap: "12px", width: "100%" }}>
        {isFirebaseConfigured ? (
          <>
            <button
              className="btn btn-accent"
              onClick={loginWithGoogle}
              style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "16px", gap: "12px" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <button
              className="btn btn-secondary"
              onClick={loginAsGuest}
              style={{ width: "100%", padding: "14px", fontSize: "14px", borderRadius: "16px" }}
            >
              Continue Offline
            </button>
          </>
        ) : (
          <>
            <div className="flex-column" style={{
              padding: "16px",
              background: "rgba(201, 242, 76, 0.08)",
              borderRadius: "16px",
              marginBottom: "8px",
              textAlign: "left",
              gap: "6px"
            }}>
              <span className="semibold text-sm orange-accent">Firebase keys not configured</span>
              <p className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Add your Firebase environment variables in Vercel to enable cloud features.
              </p>
            </div>
            <button
              className="btn btn-accent"
              onClick={loginAsGuest}
              style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "16px" }}
            >
              Continue as Guest
            </button>
          </>
        )}
      </div>
    </div>
  );
};
