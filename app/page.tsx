"use client";

import { useAuth } from "./AuthContext";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";

export default function Home() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <Dashboard user={user} onLogout={logout} />;
}
