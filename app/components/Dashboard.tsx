"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { LogOut, UploadCloud, FileText, Send, ScanLine, Menu, X, Highlighter, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import gsap from "gsap";

// ─── Indexing Loading Overlay ────────────────────────────────────────────────
const INDEXING_STEPS = ["Parsing pages", "Chunking text", "Embedding chunks", "Storing vectors"];

function IndexingLoader({ active }: { active: boolean }) {
    const barRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const stepRef = useRef<HTMLSpanElement>(null);
    const stepTween = useRef<gsap.core.Tween | null>(null);
    const stepIndex = useRef(0);

    useEffect(() => {
        if (!active) return;

        // Indeterminate progress bar
        if (barRef.current) {
            gsap.killTweensOf(barRef.current);
            gsap.set(barRef.current, { scaleX: 0, transformOrigin: "left" });
            gsap.to(barRef.current, { scaleX: 1, duration: 3.5, ease: "power1.inOut", repeat: -1, yoyo: true });
        }
        if (glowRef.current) {
            gsap.killTweensOf(glowRef.current);
            gsap.to(glowRef.current, { x: "200%", duration: 1.4, ease: "power2.inOut", repeat: -1, repeatDelay: 0.4 });
        }

        // Cycle step labels
        stepIndex.current = 0;
        const cycleStep = () => {
            if (!stepRef.current) return;
            stepIndex.current = (stepIndex.current + 1) % INDEXING_STEPS.length;
            gsap.fromTo(stepRef.current,
                { autoAlpha: 0, y: 8 },
                { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }
            );
            if (stepRef.current) stepRef.current.textContent = INDEXING_STEPS[stepIndex.current];
        };
        // Init first label
        if (stepRef.current) {
            stepRef.current.textContent = INDEXING_STEPS[0];
            gsap.set(stepRef.current, { autoAlpha: 1, y: 0 });
        }
        stepTween.current = gsap.delayedCall(0.85, function loop() {
            cycleStep();
            stepTween.current = gsap.delayedCall(0.85, loop);
        });

        return () => {
            gsap.killTweensOf(barRef.current);
            gsap.killTweensOf(glowRef.current);
            stepTween.current?.kill();
        };
    }, [active]);

    if (!active) return null;

    return (
        <div style={{
            display: "flex", flexDirection: "column", gap: "10px",
            padding: "14px 20px",
            background: "linear-gradient(135deg, rgba(var(--scan-rgb,120,200,120),0.07), transparent)",
            borderRadius: "20px",
            border: "1px solid rgba(var(--scan-rgb,120,200,120),0.18)",
            backdropFilter: "blur(4px)",
        }}>
            {/* Step label */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                    background: "var(--scan)",
                    boxShadow: "0 0 8px var(--scan)",
                    animation: "pulse-dot 1.2s ease-in-out infinite",
                }} />
                <span
                    ref={stepRef}
                    style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--scan)", letterSpacing: "0.05em" }}
                />
                <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--muted)", marginLeft: "auto" }}>Indexing…</span>
            </div>

            {/* Progress bar track */}
            <div style={{
                position: "relative", height: 4, borderRadius: 4,
                background: "rgba(var(--scan-rgb,120,200,120),0.12)",
                overflow: "hidden",
            }}>
                {/* Moving bar */}
                <div ref={barRef} style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent, var(--scan), transparent)",
                    borderRadius: 4,
                }} />
                {/* Glow sweep */}
                <div ref={glowRef} style={{
                    position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                    borderRadius: 4,
                }} />
            </div>
        </div>
    );
}

function ReadyFlash({ show }: { show: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!show || !ref.current) return;
        gsap.fromTo(ref.current,
            { autoAlpha: 0, scale: 0.88, y: 10 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.8)" }
        );
        const t = setTimeout(() => {
            if (ref.current) gsap.to(ref.current, { autoAlpha: 0, y: -6, duration: 0.35, delay: 1.8 });
        }, 0);
        return () => clearTimeout(t);
    }, [show]);
    if (!show) return null;
    return (
        <div ref={ref} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 16px", borderRadius: "20px",
            background: "rgba(var(--scan-rgb,120,200,120),0.12)",
            border: "1px solid var(--scan)",
            fontSize: "0.82rem", fontFamily: "var(--font-mono)", color: "var(--scan)",
        }}>
            <CheckCircle2 size={15} />
            Document indexed — ready!
        </div>
    );
}

type Message = {
    role: "user" | "ai";
    text: string;
};

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [showMobilePdf, setShowMobilePdf] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showReadyFlash, setShowReadyFlash] = useState(false);

    const [chatWidth, setChatWidth] = useState(400);
    const isResizing = useRef(false);

    const headerRef = useRef<HTMLElement>(null);
    const pdfPanelRef = useRef<HTMLDivElement>(null);
    const chatPanelRef = useRef<HTMLDivElement>(null);
    const scanRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);

    // Entrance: header drops in, panels rise together
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set(headerRef.current, { y: -24, autoAlpha: 0 });
            gsap.set([pdfPanelRef.current, chatPanelRef.current], { y: 20, autoAlpha: 0 });

            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            tl.to(headerRef.current, { y: 0, autoAlpha: 1, duration: 0.5 })
                .to([pdfPanelRef.current, chatPanelRef.current], { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.1 }, "-=0.2");
        });
        return () => ctx.revert();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            let newWidth = window.innerWidth - e.clientX - 24;
            if (newWidth > 300 && newWidth < window.innerWidth - 300) {
                setChatWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "default";
            document.body.style.userSelect = "auto";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", text: "Drop a PDF on the left and I'll read it closely — ask me anything once it's in." },
    ]);
    const [query, setQuery] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Animate the newest chat bubble in
    useEffect(() => {
        if (lastMessageRef.current) {
            gsap.fromTo(
                lastMessageRef.current,
                { autoAlpha: 0, y: 14, scale: 0.97 },
                { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
            );
        }
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const runScanSweep = (onDone?: () => void) => {
        if (!scanRef.current) return onDone?.();
        setIsScanning(true);
        gsap.set(scanRef.current, { top: "0%", opacity: 1 });
        gsap.to(scanRef.current, {
            top: "100%",
            duration: 1.1,
            ease: "power2.inOut",
            onComplete: () => {
                setIsScanning(false);
                onDone?.();
            },
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "application/pdf") {
                alert("Please upload a valid PDF file.");
                return;
            }
            setPdfFile(file);
            setPdfUrl(URL.createObjectURL(file));
            setShowMobilePdf(false);
            setMessages([{ role: "ai", text: `Indexing **"${file.name}"**...` }]);
            requestAnimationFrame(() => runScanSweep());

            setIsIndexing(true);
            setShowReadyFlash(false);
            try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setDocumentId(data.documentId);
                setMessages([{ role: "ai", text: `Scanned **"${file.name}"**. What would you like to know?` }]);
                setShowReadyFlash(true);
                setTimeout(() => setShowReadyFlash(false), 3000);
            } catch (err) {
                setMessages([{ role: "ai", text: "Failed to index this PDF. Please try again." }]);
            } finally {
                setIsIndexing(false);
            }
        }
    };

    const handleQuerySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !pdfFile || !documentId) return;

        const userMessage = query.trim();
        setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
        setQuery("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId, query: userMessage }),
            });
            if (!res.ok) throw new Error("Failed to get response");
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: "ai", text: "Sorry, I ran into an error processing your question. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="page-container" style={{ height: "100vh", overflow: "hidden" }}>
            <header
                ref={headerRef}
                className="paper-panel site-header"
                style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, position: "relative" }}
            >
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    .app-title { font-size: 1.5rem; }
                    .desktop-menu { display: flex; align-items: center; gap: 20px; }
                    .mobile-hamburger { display: none; cursor: pointer; }
                    .mobile-dropdown { display: none; }

                    @media (max-width: 768px) {
                        .app-title { font-size: 1.1rem; }
                        .site-header { padding: 12px 16px !important; }
                        .desktop-menu { display: none; }
                        .mobile-hamburger { display: block; }
                        .mobile-dropdown {
                            display: flex; flex-direction: column; position: absolute; top: calc(100% - 8px); right: 16px;
                            background: var(--ink-raised); padding: 16px; border-radius: 12px; z-index: 10000;
                            border: 1px solid var(--line-strong); min-width: 200px;
                        }
                    }
                `,
                    }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <ScanLine color="var(--scan)" />
                    <h1 className="text-gradient app-title" style={{ margin: 0 }}>AI PDF Reader Pro</h1>
                </div>

                <div className="desktop-menu">
                    <span className="eyebrow" style={{ color: "var(--muted)" }}>{user.email}</span>
                    <button onClick={onLogout} className="btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                <div className="mobile-hamburger" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                    {showMobileMenu ? <X color="var(--paper)" size={24} /> : <Menu color="var(--paper)" size={24} />}
                </div>

                {showMobileMenu && (
                    <div className="mobile-dropdown">
                        <span style={{ color: "var(--muted)", marginBottom: "16px", display: "block", wordBreak: "break-all" }}>{user.email}</span>
                        <button onClick={onLogout} className="btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", width: "100%" }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </header>

            <div className={`dashboard-layout ${!pdfUrl ? "mobile-no-pdf" : "mobile-has-pdf"}`}>
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    .dashboard-layout { display: flex; flex: 1; padding: 24px; gap: 12px; overflow: hidden; }
                    .pdf-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
                    .chat-panel { width: var(--chat-width, 400px); display: flex; flex-direction: column; overflow: hidden; }
                    .resizer { width: 8px; cursor: col-resize; background: rgba(243,238,227,0.04); border-radius: 4px; transition: background 0.2s; z-index: 10; }
                    .resizer:hover { background: var(--scan-soft); }
                    .mobile-close-preview { display: none; }

                    @media (max-width: 768px) {
                        .dashboard-layout { padding: 12px; flex-direction: row; }
                        .dashboard-layout.mobile-no-pdf .pdf-panel { display: flex !important; flex: 1; height: 100%; border-radius: 16px; }
                        .dashboard-layout.mobile-no-pdf .chat-panel { display: none !important; }
                        .dashboard-layout.mobile-has-pdf .chat-panel { display: flex !important; width: 100% !important; flex: 1; height: 100%; }
                        .dashboard-layout.mobile-has-pdf .pdf-panel {
                            display: var(--mobile-pdf-modal, none) !important;
                            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999;
                            background: rgba(0,0,0,0.92); padding: 16px; border-radius: 0;
                        }
                        .mobile-close-preview { display: block; position: absolute; top: 16px; left: 16px; z-index: 10000; background: rgba(0,0,0,0.85); color: var(--paper); padding: 8px 16px; border-radius: 8px; cursor: pointer; border: 1px solid var(--line-strong); }
                        .resizer { display: none !important; }
                    }
                `,
                    }}
                />

                {/* Left Panel: PDF Viewer */}
                <div ref={pdfPanelRef} className="paper-panel pdf-panel" style={{ "--mobile-pdf-modal": showMobilePdf ? "flex" : "none" } as React.CSSProperties}>
                    {isScanning && <div ref={scanRef} className="scan-line" style={{ opacity: 0 }} />}

                    {!pdfUrl ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px", textAlign: "center" }}>
                            <div style={{ background: "var(--scan-soft)", padding: "22px", borderRadius: "50%", marginBottom: "24px" }}>
                                <UploadCloud size={44} color="var(--scan)" />
                            </div>
                            <div className="eyebrow" style={{ marginBottom: "10px" }}>Step 1 of 2</div>
                            <h2 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>Feed it a document</h2>
                            <p style={{ color: "var(--muted)", marginBottom: "32px", maxWidth: "380px" }}>
                                Drop a PDF here, or select one from your device. It lands on the desk to the left, ready to be questioned.
                            </p>
                            <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
                            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                                <FileText size={18} /> Select document
                            </button>
                        </div>
                    ) : (
                        <div style={{ flex: 1, position: "relative" }}>
                            <object data={pdfUrl + "#toolbar=0"} type="application/pdf" width="100%" height="100%" style={{ borderRadius: "16px", overflow: "hidden" }}>
                                <div style={{ padding: "24px", textAlign: "center" }}>
                                    <p>Your browser doesn't support built-in PDFs.</p>
                                    <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ color: "var(--scan)" }}>Click here to view</a>
                                </div>
                            </object>
                            <button className="mobile-close-preview" onClick={() => setShowMobilePdf(false)}>Close Preview</button>
                            <button
                                className="paper-panel"
                                onClick={() => { setPdfFile(null); setPdfUrl(null); setShowMobilePdf(false); }}
                                style={{ position: "absolute", top: "16px", right: "16px", padding: "8px 16px", cursor: "pointer", zIndex: 10000, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--paper)" }}
                            >
                                Change file
                            </button>
                        </div>
                    )}
                </div>

                {/* Resizer */}
                <div
                    className="resizer"
                    onMouseDown={() => {
                        isResizing.current = true;
                        document.body.style.cursor = "col-resize";
                        document.body.style.userSelect = "none";
                    }}
                />

                {/* Right Panel: AI Chat */}
                <div ref={chatPanelRef} className="paper-panel chat-panel" style={{ "--chat-width": `${chatWidth}px` } as React.CSSProperties}>
                    <div style={{ padding: "20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <Highlighter size={20} color="var(--highlight)" />
                            <h3 style={{ margin: 0, fontSize: "1.15rem" }}>Margin notes</h3>
                        </div>
                        {pdfFile && (
                            <div
                                onClick={() => setShowMobilePdf(true)}
                                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: "var(--scan-soft)", border: "1px solid var(--scan)", borderRadius: "16px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}
                            >
                                <FileText size={13} color="var(--scan)" />
                                <span style={{ color: "var(--paper)", maxWidth: "100px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pdfFile.name}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
                        {messages.map((msg, idx) => {
                            const isLast = idx === messages.length - 1;
                            return (
                                <div
                                    key={idx}
                                    ref={isLast ? lastMessageRef : null}
                                    className={msg.role === "ai" ? "note-ai" : "note-user"}
                                    style={{
                                        alignSelf: msg.role === "ai" ? "flex-start" : "flex-end",
                                        maxWidth: "88%",
                                        padding: "12px 16px",
                                        borderRadius: "4px 14px 14px 14px",
                                        lineHeight: 1.55,
                                        fontSize: "0.95rem",
                                    }}
                                >
                                    {msg.role === "ai" ? (
                                        <div className="ai-markdown">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            );
                        })}
                        <style
                            dangerouslySetInnerHTML={{
                                __html: `
                                .ai-markdown ul { list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
                                .ai-markdown ol { list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
                                .ai-markdown p { margin-bottom: 0.5rem; }
                                .ai-markdown p:last-child { margin-bottom: 0; }
                                .ai-markdown strong { color: var(--scan); }
                                .ai-markdown table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                                .ai-markdown th, .ai-markdown td { border: 1px solid var(--line-strong); padding: 8px 12px; text-align: left; }
                                .ai-markdown th { background: var(--scan-soft); }
                            `,
                            }}
                        />
                        {isTyping && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: "16px 20px 20px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @keyframes pulse-dot {
                                0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--scan); }
                                50% { opacity: 0.4; box-shadow: 0 0 3px var(--scan); }
                            }
                            @keyframes shimmer-slide {
                                0% { background-position: -200% center; }
                                100% { background-position: 200% center; }
                            }
                            .input-shimmer {
                                background: linear-gradient(90deg,
                                    rgba(var(--scan-rgb,120,200,120),0.04) 25%,
                                    rgba(var(--scan-rgb,120,200,120),0.13) 50%,
                                    rgba(var(--scan-rgb,120,200,120),0.04) 75%
                                );
                                background-size: 200% 100%;
                                animation: shimmer-slide 1.8s ease-in-out infinite;
                            }
                        ` }} />

                        {/* Indexing loader sits above input */}
                        <IndexingLoader active={isIndexing} />
                        <ReadyFlash show={showReadyFlash} />

                        <form onSubmit={handleQuerySubmit} style={{ display: "flex", gap: "12px" }}>
                            <input
                                type="text"
                                placeholder={
                                    isIndexing ? "Indexing, please wait…"
                                        : pdfFile ? "Ask a question…"
                                            : "Upload a PDF first…"
                                }
                                className={`input-field${isIndexing ? " input-shimmer" : ""}`}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={!pdfFile || isTyping || isIndexing || !documentId}
                                style={{
                                    borderRadius: "24px",
                                    opacity: !pdfFile || isIndexing || !documentId ? 0.65 : 1,
                                    transition: "opacity 0.4s ease, border-color 0.4s ease",
                                    borderColor: isIndexing ? "var(--scan)" : undefined,
                                }}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!pdfFile || isTyping || !query.trim() || isIndexing || !documentId}
                                style={{ borderRadius: "50%", padding: "12px", opacity: !pdfFile || isTyping || !query.trim() || isIndexing || !documentId ? 0.5 : 1 }}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TypingIndicator() {
    const dotsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!dotsRef.current) return;
        const dots = dotsRef.current.querySelectorAll("span");
        const tl = gsap.timeline({ repeat: -1 });
        tl.to(dots, { y: -5, duration: 0.3, stagger: { each: 0.12, yoyo: true, repeat: 1 }, ease: "sine.inOut" });
        return () => { tl.kill(); };
    }, []);

    return (
        <div className="note-ai" style={{ alignSelf: "flex-start", padding: "14px 18px", borderRadius: "4px 14px 14px 14px", display: "flex", gap: "5px" }}>
            <div ref={dotsRef} style={{ display: "flex", gap: "5px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--scan)", display: "inline-block" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--scan)", display: "inline-block" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--scan)", display: "inline-block" }} />
            </div>
        </div>
    );
}