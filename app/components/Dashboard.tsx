"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, UploadCloud, Search, FileText, Send, Sparkles, Menu, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
    role: 'user' | 'ai';
    text: string;
};

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [showMobilePdf, setShowMobilePdf] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [chatWidth, setChatWidth] = useState(400);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            // Calculate width from the right side of the window (minus padding ~48px offset)
            let newWidth = window.innerWidth - e.clientX - 24;
            if (newWidth > 300 && newWidth < window.innerWidth - 300) {
                setChatWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: 'Hello! Upload a PDF on the left and ask me anything about it here.' }
    ]);
    const [query, setQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "application/pdf") {
                alert("Please upload a valid PDF file.");
                return;
            }
            setPdfFile(file);
            setPdfUrl(URL.createObjectURL(file));
            setShowMobilePdf(false);
            setMessages([{ role: 'ai', text: `I've analyzed "${file.name}". What would you like to know?` }]);
        }
    };

    const handleQuerySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !pdfFile) return;

        const userMessage = query.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setQuery("");
        setIsTyping(true);

        try {
            // Create FormData to send PDF and question
            const formData = new FormData();
            formData.append("file", pdfFile);
            formData.append("query", userMessage);

            const res = await fetch("/api/chat", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Failed to get response");
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I ran into an error processing your question. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="page-container" style={{ height: '100vh', overflow: 'hidden' }}>

            {/* Header */}
            <header className="glass-panel site-header" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, position: 'relative' }}>
                <style dangerouslySetInnerHTML={{
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
                            background: rgba(0,0,0,0.95); padding: 16px; border-radius: 12px; z-index: 10000;
                            border: 1px solid var(--border-color); min-width: 200px;
                        }
                    }
                `}} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles color="var(--accent)" />
                    <h1 className="text-gradient app-title" style={{ margin: 0 }}>AI PDF Reader Pro</h1>
                </div>

                {/* Desktop Menu */}
                <div className="desktop-menu">
                    <span style={{ color: 'var(--text-muted)' }}>{user.email}</span>
                    <button onClick={onLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="mobile-hamburger" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                    {showMobileMenu ? <X color="var(--text-main)" size={24} /> : <Menu color="var(--text-main)" size={24} />}
                </div>

                {/* Mobile Dropdown */}
                {showMobileMenu && (
                    <div className="mobile-dropdown glass-panel animate-fade-in">
                        <span style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'block', wordBreak: 'break-all' }}>{user.email}</span>
                        <button onClick={onLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', width: '100%' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </header>

            {/* Main Two-Panel Interface */}
            <div className={`dashboard-layout ${!pdfUrl ? 'mobile-no-pdf' : 'mobile-has-pdf'}`}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .dashboard-layout { display: flex; flex: 1; padding: 24px; gap: 12px; overflow: hidden; }
                    .pdf-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                    .chat-panel { width: var(--chat-width, 400px); display: flex; flex-direction: column; overflow: hidden; }
                    .resizer { width: 8px; cursor: col-resize; background: rgba(255, 255, 255, 0.05); border-radius: 4px; transition: background 0.2s; z-index: 10; }
                    .resizer:hover { background: rgba(32, 227, 178, 0.4); }
                    .mobile-close-preview { display: none; }
                    
                    @media (max-width: 768px) {
                        .dashboard-layout { padding: 12px; flex-direction: row; }
                        
                        /* No PDF uploaded: Show Upload Panel, Hide Chat */
                        .dashboard-layout.mobile-no-pdf .pdf-panel { display: flex !important; flex: 1; height: 100%; border-radius: 16px; }
                        .dashboard-layout.mobile-no-pdf .chat-panel { display: none !important; }
                        
                        /* PDF uploaded: Show Chat Panel, Hide PDF Panel (Unless toggled) */
                        .dashboard-layout.mobile-has-pdf .chat-panel { display: flex !important; width: 100% !important; flex: 1; height: 100%; }
                        
                        .dashboard-layout.mobile-has-pdf .pdf-panel { 
                            display: var(--mobile-pdf-modal, none) !important;
                            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999;
                            background: rgba(0,0,0,0.9); padding: 16px; border-radius: 0;
                        }
                        
                        .mobile-close-preview { display: block; position: absolute; top: 16px; left: 16px; z-index: 10000; background: rgba(0,0,0,0.8); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color); }
                        .resizer { display: none !important; }
                    }
                `}} />

                {/* Left Panel: PDF Viewer */}
                <div className="glass-panel animate-fade-in pdf-panel" style={{ '--mobile-pdf-modal': showMobilePdf ? 'flex' : 'none' } as React.CSSProperties}>
                    {!pdfUrl ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(32, 227, 178, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                                <UploadCloud size={48} color="var(--accent)" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Upload your PDF</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px' }}>
                                Drag and drop or select a PDF document from your device to begin the AI analysis.
                            </p>
                            <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                                <FileText size={18} /> Select Document
                            </button>
                        </div>
                    ) : (
                        <div style={{ flex: 1, position: 'relative' }}>
                            {/* Native PDF Viewer */}
                            <object
                                data={pdfUrl + "#toolbar=0"}
                                type="application/pdf"
                                width="100%"
                                height="100%"
                                style={{ borderRadius: '16px', overflow: 'hidden' }}
                            >
                                <div style={{ padding: '24px', textAlign: 'center' }}>
                                    <p>Your browser doesn't support built-in PDFs.</p>
                                    <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Click here to view</a>
                                </div>
                            </object>
                            <button
                                className="mobile-close-preview"
                                onClick={() => setShowMobilePdf(false)}
                            >
                                Close Preview
                            </button>
                            <button
                                className="glass-panel"
                                onClick={() => { setPdfFile(null); setPdfUrl(null); setShowMobilePdf(false); }}
                                style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', zIndex: 10000 }}
                            >
                                Change File
                            </button>
                        </div>
                    )}
                </div>

                {/* Resizer */}
                <div
                    className="resizer"
                    onMouseDown={() => {
                        isResizing.current = true;
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                    }}
                />

                {/* Right Panel: AI Chat */}
                <div className="glass-panel animate-fade-in chat-panel" style={{ '--chat-width': `${chatWidth}px`, animationDelay: '0.1s' } as React.CSSProperties}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Sparkles size={20} color="var(--accent)" />
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Ask Context AI</h3>
                        </div>
                        {pdfFile && (
                            <div
                                onClick={() => setShowMobilePdf(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(32, 227, 178, 0.1)', border: '1px solid var(--accent)', borderRadius: '16px', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                <FileText size={14} color="var(--accent)" />
                                <span style={{ color: 'var(--text-main)', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pdfFile.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                                maxWidth: '85%',
                                background: msg.role === 'ai' ? 'rgba(32, 227, 178, 0.1)' : 'var(--primary-gradient)',
                                color: msg.role === 'ai' ? 'var(--text-main)' : '#000',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                                border: msg.role === 'ai' ? '1px solid rgba(32, 227, 178, 0.2)' : 'none',
                                lineHeight: 1.5,
                                fontSize: '0.95rem'
                            }}>
                                {msg.role === 'ai' ? (
                                    <div className="ai-markdown">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        ))}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                .ai-markdown ul { list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
                                .ai-markdown ol { list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
                                .ai-markdown p { margin-bottom: 0.5rem; }
                                .ai-markdown p:last-child { margin-bottom: 0; }
                                .ai-markdown strong { color: var(--accent); }
                                .ai-markdown table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                                .ai-markdown th, .ai-markdown td { border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 12px; text-align: left; }
                                .ai-markdown th { background: rgba(32, 227, 178, 0.1); }
                            `}} />
                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'rgba(32, 227, 178, 0.05)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                                Analyzing document...
                            </div>
                        )}
                    </div>

                    {/* Input Box */}
                    <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <form onSubmit={handleQuerySubmit} style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder={pdfFile ? "Ask a question..." : "Upload PDF first..."}
                                className="input-field"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                disabled={!pdfFile || isTyping}
                                style={{ borderRadius: '24px', opacity: !pdfFile ? 0.5 : 1 }}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!pdfFile || isTyping || !query.trim()}
                                style={{ borderRadius: '50%', padding: '12px', opacity: (!pdfFile || isTyping || !query.trim()) ? 0.5 : 1 }}
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
