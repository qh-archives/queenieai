"use client";
import { useEffect, useRef, useState } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";

type Msg = { role: "user" | "assistant"; content: string };

const inter = Inter({ subsets: ["latin"] });

export default function QueenieWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hello! (: I’m Queenie Bot — ask me about my projects, my background, or my work experiences." }
  ]);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // NEW: image src swap state for hover "pause"
  const [iconSrc, setIconSrc] = useState("/QueenieWidget.gif");

  async function send() {
    const text = input.trim(); if (!text) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-6) })
      });
      const data = await r.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Sorry — I had trouble replying. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className={inter.className}>
      {/* Floating launcher button with GIF that swaps to still image on hover */}
      <button
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setIconSrc("/QueenieWidget_still.png")}
        onMouseLeave={() => { setIconSrc("/QueenieWidget.gif"); setShowCursor(false); }}
        onMouseOver={() => setShowCursor(true)}
        onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 127,
          height: 127,
          borderRadius: 0,
          padding: 0,
          border: "none",
          background: "transparent",
          boxShadow: "none",
          cursor: "pointer",
          zIndex: 40
        }}
      >
        <Image
          src={iconSrc}
          alt="Queenie Bot"
          width={127}
          height={127}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
            backgroundColor: "transparent",
            imageRendering: "crisp-edges",
            borderRadius: 0,
            display: "block",
            // Optional: subtle focus ring for a11y when using keyboard
            outline: "none"
          }}
        />
      </button>

      {showCursor && (
        <Image
          src="/chatme.png"
          alt=""
          width={563}
          height={152}
          style={{
            position: "fixed",
            width: "auto",
            height: "auto",
            left: cursorPos.x,
            top: cursorPos.y,
            pointerEvents: "none",
            userSelect: "none",
            imageRendering: "crisp-edges",
            transform: "translate(-100%, -100%) translate(5px, 5px)",
            transformOrigin: "top left",
            transition: "left 180ms cubic-bezier(.2,.8,.2,1), top 180ms cubic-bezier(.2,.8,.2,1), transform 180ms cubic-bezier(.2,.8,.2,1)",
            zIndex: 60
          }}
        />
      )}

      {open && (
        <div style={{
          position:"fixed", right:20, bottom:162, width:504, height:672, background:"#000",
          color:"#fff", borderRadius:16, boxShadow:"none", display:"flex", flexDirection:"column", overflow:"visible", zIndex: 50
        }}>
          {/* Bubble arrow */}
          <div style={{ position:"absolute", bottom:-10, right:73, width:0, height:0, borderLeft:"10px solid transparent", borderRight:"10px solid transparent", borderTop:"10px solid #000" }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:12, fontWeight:700 }}>
            <span>Queenie Bot</span>
            <button
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              style={{
                background:"transparent",
                color:"#fff",
                border:"1px solid #333",
                borderRadius:8,
                padding:"6px 8px",
                lineHeight:1,
                cursor:"pointer"
              }}
            >
              ×
            </button>
          </div>
          <div ref={boxRef} style={{ flex:1, padding:16, overflowY:"auto", lineHeight:1.55 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ margin:"8px 0", textAlign:m.role==="user"?"right":"left" }}>
                <div style={{ display:"inline-block", padding:"10px 12px", borderRadius:12, background:m.role==="user"?"#222":"#111", color:"#fff", border:"1px solid #333", maxWidth: "80%" }}>
                  {m.content.replaceAll("**", "")}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ margin:"8px 0", textAlign:"left" }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 12px", borderRadius:12, background:"#111", color:"#fff", border:"1px solid #333" }}>
                  <span className="qb-dot" />
                  <span className="qb-dot" />
                  <span className="qb-dot" />
                </div>
              </div>
            )}
          </div>
          <div style={{ padding:12, display:"flex", gap:8 }}>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Ask about my work…" aria-label="Message"
              style={{ flex:1, border:"1px solid #333", background:"#000", color:"#fff", borderRadius:10, padding:"10px 12px" }}/>
            <button onClick={send} style={{ padding:"10px 14px", borderRadius:10, background:"#222", color:"#fff", border:"1px solid #444" }}>Send</button>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes qb-blink { 0%, 80%, 100% { opacity: 0.2 } 40% { opacity: 1 } }
        .qb-dot { width: 6px; height: 6px; border-radius: 9999px; background: #888; opacity: 0.3; animation: qb-blink 1.4s infinite; display: inline-block; }
        .qb-dot:nth-child(2) { animation-delay: 0.2s }
        .qb-dot:nth-child(3) { animation-delay: 0.4s }
      `}</style>
    </div>
  );
}
