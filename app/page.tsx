"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { useAuth } from "./AuthContext";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cross-fade whenever we swap between the auth screen and the dashboard
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(wrapRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out" });
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="page-container" style={{ justifyContent: "center", alignItems: "center", gap: "16px" }}>
        <div className="eyebrow">Booting up the scanner</div>
        <div
          style={{
            width: "38px",
            height: "38px",
            border: "3px solid var(--line)",
            borderTopColor: "var(--scan)",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {!user ? <AuthScreen /> : <Dashboard user={user} onLogout={logout} />}
    </div>
  );
}