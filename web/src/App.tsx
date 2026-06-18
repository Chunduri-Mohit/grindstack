import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { Navigation, type ScreenType } from "./components/Navigation";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { AcademyScreen } from "./screens/AcademyScreen";
import { WellbeingScreen } from "./screens/WellbeingScreen";
import { SquadScreen } from "./screens/SquadScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("dashboard");

  if (loading) {
    return (
      <div className="desktop-wrapper">
        <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <h1 className="login-logo" style={{ animation: "pulse 1.5s infinite" }}>GRINDSTACK</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Synthesizing your grind...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render LoginScreen if not authenticated
  if (!user) {
    return (
      <div className="desktop-wrapper">
        <div className="app-container" style={{ paddingBottom: "20px" }}>
          <LoginScreen />
        </div>
      </div>
    );
  }

  // Render dynamic screen content
  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <DashboardScreen />;
      case "academy":
        return <AcademyScreen />;
      case "wellbeing":
        return <WellbeingScreen />;
      case "squad":
        return <SquadScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const getScreenTitle = () => {
    switch (currentScreen) {
      case "dashboard": return "DASHBOARD";
      case "academy": return "ACADEMY";
      case "wellbeing": return "WELLBEING";
      case "squad": return "SQUAD";
      case "profile": return "PROFILE";
      default: return "GRINDSTACK";
    }
  };

  return (
    <div className="desktop-wrapper">
      <div className="app-container">
        {/* Sticky Header */}
        <header className="app-header">
          <span className="app-title">GRINDSTACK</span>
          <span className="badge badge-orange" style={{ fontSize: "11px" }}>
            {getScreenTitle()}
          </span>
        </header>

        {/* Dynamic screen views */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {renderScreen()}
        </main>

        {/* Bottom Tab Bar Navigation */}
        <Navigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
