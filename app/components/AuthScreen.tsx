"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function AuthScreen() {
    const { refreshUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) return;
        setLoading(true);

        try {
            const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            await refreshUser();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>

            <div className="glass-panel animate-fade-in" style={{ padding: '40px', maxWidth: '450px', width: '90%', position: 'relative', zIndex: 10 }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', background: 'var(--primary-gradient)', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
                        <ShieldCheck size={32} color="#000" />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Experience AI-powered PDF insights.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{ padding: '12px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.9rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <div style={{ position: 'relative' }}>
                            <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')} <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(""); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', textDecoration: 'underline' }}
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>

            </div>

            {/* Decorative background blurs */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '300px', height: '300px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '20%', right: '30%', width: '300px', height: '300px', background: '#0cebeb', filter: 'blur(150px)', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }} />

        </div>
    );
}
