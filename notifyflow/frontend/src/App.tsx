// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const C = {
  bg: "#0a0e17", surface: "#111827", border: "#1e2d45",
  orange: "#f97316", blue: "#38bdf8", green: "#22c55e",
  red: "#ef4444", text: "#e2e8f0", muted: "#64748b",
};

function statusBadge(status) {
  const map = {
    queued:     { color: C.blue,   bg: "rgba(56,189,248,0.08)",  border: "1px solid rgba(56,189,248,0.3)",  label: "⟳ Na fila" },
    processing: { color: C.orange, bg: "rgba(249,115,22,0.08)",  border: "1px solid rgba(249,115,22,0.3)",  label: "⚡ Processando" },
    sent:       { color: C.green,  bg: "rgba(34,197,94,0.08)",   border: "1px solid rgba(34,197,94,0.3)",   label: "✓ Enviado" },
    failed:     { color: C.red,    bg: "rgba(239,68,68,0.08)",   border: "1px solid rgba(239,68,68,0.3)",   label: "✕ Falhou" },
  };
  const s = map[status] ?? map.queued;
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 8px", color: s.color, background: s.bg, border: s.border }}>{s.label}</span>;
}

export default function App() {
  const [type, setType] = useState("email");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = async () => {
    if (!recipient || !message) return showToast("Preencha destinatário e mensagem.", false);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/notifications`, { type, recipient, subject, message, priority });
      setHistory(prev => [{ notificationId: data.notificationId, type, recipient, subject, message, priority, status: "queued", createdAt: new Date().toISOString() }, ...prev]);
      showToast("Notificação enviada para a fila!", true);
      setRecipient(""); setSubject(""); setMessage("");
    } catch (e) {
      showToast(e.response?.data?.error ?? "Erro ao enviar.", false);
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: "'Space Mono', monospace", fontSize: 13, padding: "11px 14px", outline: "none" };

  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #f97316; }
        body { background: #0a0e17; }
        body::before { content: ''; position: fixed; inset: 0; background-image: linear-gradient(rgba(30,45,69,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,69,0.2) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; z-index: 0; }
        input:focus, select:focus, textarea:focus { border-color: #f97316 !important; }
      `}</style>

      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Space Mono', monospace", fontSize: 14 }}>

        {/* NAV */}
        <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,14,23,0.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
          <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 20, fontWeight: 800 }}>Notify<span style={{ color: C.orange }}>Flow</span></span>
          <div style={{ display: "flex", gap: 8 }}>
            {[["AWS SQS", C.blue], ["AWS SES", C.green], ["AWS SNS", C.orange]].map(([label, color]) => (
              <span key={label} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "4px 10px", border: `1px solid ${color}40`, color, background: `${color}14` }}>{label}</span>
            ))}
          </div>
        </nav>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px", position: "relative", zIndex: 1 }}>

          {/* HERO */}
          <motion.div style={{ marginBottom: 40 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>// Sistema de Notificações Multi-canal</p>
            <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
              Envie notificações por<br /><span style={{ color: C.orange }}>email, SMS e push</span>
            </h1>
            <p style={{ fontSize: 15, color: C.muted }}>Mensagens processadas via fila SQS com entrega garantida por SES e SNS.</p>
          </motion.div>

          {/* FORM */}
          <motion.div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 32, marginBottom: 32 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Nova Notificação</h2>

            {/* TYPE SELECTOR */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 8 }}>Tipo</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["email", "✉"], ["sms", "📱"], ["push", "🔔"]].map(([t, icon]) => (
                  <button key={t} onClick={() => setType(t)} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "8px 16px", border: `1px solid ${type === t ? C.orange : C.border}`, background: type === t ? C.orange : "transparent", color: type === t ? C.bg : C.muted, cursor: "pointer" }}>
                    {icon} {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 8 }}>
                  {type === "email" ? "Email" : type === "sms" ? "Telefone" : "Topic ARN"}
                </label>
                <input style={inp} value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={type === "email" ? "email@exemplo.com" : type === "sms" ? "+5513999999999" : "arn:aws:sns:..."} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 8 }}>Prioridade</label>
                <select style={inp} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="high">🔴 Alta</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="low">🟢 Baixa</option>
                </select>
              </div>
            </div>

            {type === "email" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 8 }}>Assunto</label>
                <input style={inp} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto do email" />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 8 }}>Mensagem</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 100 }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Conteúdo da notificação..." />
            </div>

            <button onClick={handleSend} disabled={loading} style={{ background: C.orange, color: C.bg, fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: "12px 28px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Enviando..." : "→ Enviar Notificação"}
            </button>
          </motion.div>

          {/* HISTORY */}
          {history.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                Histórico <span style={{ color: C.orange }}>({history.length})</span>
              </h2>
              {history.map((n, i) => (
                <motion.div key={n.notificationId} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, marginBottom: 12 }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.orange}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 14, fontWeight: 700 }}>
                      {n.type === "email" ? "✉" : n.type === "sms" ? "📱" : "🔔"} {n.type.toUpperCase()} → {n.recipient}
                    </span>
                    {statusBadge(n.status)}
                  </div>
                  <p style={{ fontSize: 11, color: C.muted }}>{new Date(n.createdAt).toLocaleString("pt-BR")} · Prioridade: {n.priority}</p>
                  {n.subject && <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Assunto: {n.subject}</p>}
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>{n.message}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

        {/* TOAST */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ position: "fixed", bottom: 24, right: 24, background: toast.ok ? C.green : C.red, color: C.bg, fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, padding: "12px 20px", zIndex: 999 }}>
              {toast.ok ? "✓" : "✕"} {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
