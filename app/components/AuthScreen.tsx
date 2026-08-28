"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import { Lock, Mail, ArrowRight, ScanLine, FileStack } from "lucide-react";
import gsap from "gsap";
import { useAuth } from "../AuthContext";

export default function AuthScreen() {
    const { refreshUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const scanRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const docARef = useRef<HTMLDivElement>(null);
    const docBRef = useRef<HTMLDivElement>(null);

    // Entrance timeline: floating docs drift in, scan-line sweeps down the card,
    // card fades up, then fields stagger in behind it.
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            gsap.set(cardRef.current, { autoAlpha: 0, y: 28 });
            gsap.set(scanRef.current, { top: "-4%", opacity: 0 });
            gsap.set(".auth-field", { autoAlpha: 0, y: 14 });
            gsap.set([docARef.current, docBRef.current], { autoAlpha: 0 });

            tl.to([docARef.current, docBRef.current], {
                autoAlpha: 1,
                duration: 0.9,
                stagger: 0.15,
            })
                .to(cardRef.current, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.1)
                .to(scanRef.current, { opacity: 1, duration: 0.15 }, 0.2)
                .to(scanRef.current, { top: "104%", duration: 0.85, ease: "power2.inOut" }, 0.2)
                .to(scanRef.current, { opacity: 0, duration: 0.2 }, "-=0.1")
                .to(".auth-field", { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08 }, "-=0.5");

            // Ambient float on the background document scraps
            gsap.to(docARef.current, { y: -14, rotate: -1.5, duration: 4.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
            gsap.to(docBRef.current, { y: 12, rotate: 2, duration: 5.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.4 });

            // Subtle parallax on pointer move
            const onMove = (e: MouseEvent) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 2;
                const y = (e.clientY / window.innerHeight - 0.5) * 2;
                gsap.to(docARef.current, { x: x * -18, duration: 0.6, overwrite: "auto" });
                gsap.to(docBRef.current, { x: x * 14, duration: 0.6, overwrite: "auto" });
                gsap.to(cardRef.current, { rotateY: x * 1.2, rotateX: y * -1.2, duration: 0.6, overwrite: "auto" });
            };
            window.addEventListener("mousemove", onMove);
            return () => window.removeEventListener("mousemove", onMove);
        }, rootRef);

        return () => ctx.revert();
    }, []);

    // Re-run scan sweep + field stagger whenever the mode flips
    const runModeSwitch = (next: boolean) => {
        const tl = gsap.timeline();
        tl.to(formRef.current, { autoAlpha: 0, y: -8, duration: 0.18, ease: "power1.in" })
            .call(() => setIsLogin(next))
            .set(scanRef.current, { top: "-4%", opacity: 1 })
            .to(scanRef.current, { top: "104%", duration: 0.6, ease: "power2.inOut" }, "<")
            .to(scanRef.current, { opacity: 0, duration: 0.15 }, "-=0.1")
            .fromTo(formRef.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 }, "-=0.35")
            .fromTo(".auth-field", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.06 }, "-=0.3");
    };

    const magnetize = (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: relX * 0.25, y: relY * 0.35, duration: 0.3, ease: "power2.out" });
    };
    const unmagnetize = (e: React.MouseEvent<HTMLButtonElement>) => {
        gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });
    };

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
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            await refreshUser();
        } catch (err: any) {
            setError(err.message);
            gsap.fromTo(".auth-error", { x: -6 }, { x: 6, duration: 0.06, repeat: 5, yoyo: true, clearProps: "x" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={rootRef}
            className="page-container"
            style={{ justifyContent: "center", alignItems: "center", perspective: "1200px", position: "relative", overflow: "hidden" }}
        >
            {/* Floating background document scraps — the "desk" the card sits on */}
            <div
                ref={docARef}
                style={{
                    position: "absolute", top: "16%", left: "12%", width: "160px", height: "210px",
                    background: "var(--ink-raised)", border: "1px solid var(--line)", borderRadius: "10px",
                    transform: "rotate(-6deg)", padding: "16px", zIndex: 0,
                }}
            >
                <div style={{ width: "60%", height: "8px", background: "var(--line-strong)", borderRadius: "4px", marginBottom: "10px" }} />
                <div style={{ width: "90%", height: "5px", background: "var(--line)", borderRadius: "4px", marginBottom: "7px" }} />
                <div style={{ width: "80%", height: "5px", background: "var(--line)", borderRadius: "4px", marginBottom: "7px" }} />
                <div style={{ width: "40%", height: "5px", background: "var(--highlight-soft)", borderRadius: "4px" }} />
            </div>
            <div
                ref={docBRef}
                style={{
                    position: "absolute", bottom: "14%", right: "13%", width: "150px", height: "190px",
                    background: "var(--ink-raised)", border: "1px solid var(--line)", borderRadius: "10px",
                    transform: "rotate(5deg)", padding: "16px", zIndex: 0,
                }}
            >
                <FileStack size={18} color="var(--scan)" style={{ marginBottom: "10px" }} />
                <div style={{ width: "70%", height: "5px", background: "var(--line)", borderRadius: "4px", marginBottom: "7px" }} />
                <div style={{ width: "50%", height: "5px", background: "var(--line)", borderRadius: "4px" }} />
            </div>

            <div
                ref={cardRef}
                className="paper-panel"
                style={{ padding: "44px", maxWidth: "440px", width: "90%", position: "relative", zIndex: 10, overflow: "hidden" }}
            >
                <div ref={scanRef} className="scan-line" />

                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <div className="eyebrow" style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <ScanLine size={14} /> AI PDF READER PRO
                    </div>
                    <h2 style={{ fontSize: "2.1rem", marginBottom: "8px" }}>
                        {isLogin ? "Welcome back to the desk" : "Pull up a chair"}
                    </h2>
                    <p style={{ color: "var(--muted)" }}>
                        {isLogin ? "Your documents are exactly where you left them." : "Every PDF you upload gets read closely."}
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {error && (
                        <div
                            className="auth-error"
                            style={{
                                padding: "12px 14px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)",
                                borderRadius: "8px", color: "var(--danger)", fontSize: "0.88rem", fontFamily: "var(--font-mono)",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div className="auth-field">
                        <div style={{ position: "relative" }}>
                            <Mail size={18} color="var(--muted)" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: "46px" }}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <div style={{ position: "relative" }}>
                            <Lock size={18} color="var(--muted)" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: "46px" }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary auth-field"
                        disabled={loading}
                        onMouseMove={magnetize}
                        onMouseLeave={unmagnetize}
                        style={{ width: "100%", marginTop: "6px", opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? "Scanning credentials…" : isLogin ? "Sign in" : "Create account"} <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "26px" }}>
                    <button
                        type="button"
                        onClick={() => runModeSwitch(!isLogin)}
                        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.8rem", letterSpacing: "0.02em" }}
                    >
                        {isLogin ? "No account yet? Sign up →" : "← Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}