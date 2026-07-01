import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAlerts, draftReengagement } from "../services/api";
import { AlertTriangle, Clock, Flame, RefreshCw, Mail, ChevronRight, X, Send, CheckCircle } from "lucide-react";

type AlertItem = {
  id: number; name: string; company: string;
  warmthScore: number; daysSinceContact: number;
  overdueFollowUp: boolean; promises: string[];
  lastNote: string; reason: "going_cold" | "overdue"; insight: string;
};

export default function Alerts() {
  const [data, setData]           = useState<{ alerts: AlertItem[]; aiInsight: string | null } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [drafts, setDrafts]       = useState<Record<number, string>>({});
  const [draftLoading, setDraftLoading] = useState<Record<number, boolean>>({});
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [expanded, setExpanded]   = useState<number | null>(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getAlerts().then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDraft = async (id: number) => {
    setDraftLoading(d => ({ ...d, [id]: true }));
    setExpanded(id);
    const result = await draftReengagement(id);
    setDrafts(d => ({ ...d, [id]: result.draft }));
    setDraftLoading(d => ({ ...d, [id]: false }));
  };

  const visible = (data?.alerts ?? []).filter(a => !dismissed.has(a.id));
  const scoreColor = (s: number) => s >= 70 ? "#00FF88" : s >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ padding: "40px 40px 60px 280px", minHeight: "100vh", position: "relative", zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8F91A2", marginBottom: 8 }}>Cold Alert System</div>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.5rem", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Pipeline Alerts</h1>
            <p style={{ color: "#8F91A2", fontSize: "0.95rem", marginTop: 6 }}>AI-drafted messages — you review and approve before anything is sent</p>
          </div>
          <button onClick={load} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--surface)",
            color: "#C8CAD5", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
          }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {/* All clear */}
        {!loading && visible.length === 0 && (
          <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", padding: "56px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)", display: "flex",
              alignItems: "center", justifyContent: "center", marginBottom: 18,
            }}>
              <CheckCircle size={32} style={{ color: "#22C55E" }} />
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#F8FAFC", marginBottom: 8 }}>All clear — no cold leads right now</div>
            <p style={{ fontSize: "0.9rem", color: "#C8CAD5", maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>Keep following up regularly to maintain warmth scores above 35.</p>
            <button
              onClick={() => navigate("/leads")}
              style={{
                background: "#5E6AD2", border: "none", borderRadius: 8,
                padding: "10px 20px", color: "#fff", fontWeight: 700, cursor: "pointer",
                fontSize: "0.85rem",
                boxShadow: "0 4px 14px rgba(94, 106, 210, 0.4)",
              }}
            >
              View Pipeline
            </button>
          </div>
        )}

        {/* AI summary banner */}
        {!loading && data?.aiInsight && visible.length > 0 && (
          <div style={{ borderRadius: 14, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "0.875rem", color: "#C8CAD5", margin: 0, lineHeight: 1.6 }}>
              <span style={{ color: "#EF4444", fontWeight: 700 }}>AI Alert: </span>{data.aiInsight}
            </p>
          </div>
        )}

      {/* Alert cards */}
      {!loading && visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map(alert => {
            const isExpanded = expanded === alert.id;
            const hasDraft   = !!drafts[alert.id];
            const isDrafting = !!draftLoading[alert.id];

            return (
              <div key={alert.id} style={{
                borderRadius: 14,
                border: `1px solid ${alert.reason === "going_cold" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                background: alert.reason === "going_cold" ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)",
                overflow: "hidden",
              }}>
                {/* Row */}
                <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: alert.reason === "going_cold" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                    border: `1px solid ${alert.reason === "going_cold" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {alert.reason === "going_cold" ? <Flame size={16} color="#EF4444" /> : <Clock size={16} color="#F59E0B" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#F0F4FF" }}>{alert.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{alert.company}</span>
                      <span style={{
                        fontSize: "0.62rem", padding: "2px 8px", borderRadius: 99, fontWeight: 600,
                        background: alert.reason === "going_cold" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.1)",
                        color: alert.reason === "going_cold" ? "#EF4444" : "#F59E0B",
                        border: `1px solid ${alert.reason === "going_cold" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.2)"}`,
                      }}>
                        {alert.reason === "going_cold" ? "🧊 Going cold" : `⏰ Overdue ${alert.daysSinceContact}d`}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>{alert.insight}</p>
                  </div>

                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: scoreColor(alert.warmthScore) }}>{alert.warmthScore}</div>
                    <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>warmth</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleDraft(alert.id)} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: "0.75rem",
                      background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", cursor: "pointer",
                    }}>
                      <Mail size={12} /> Draft
                    </button>
                    <button onClick={() => navigate("/leads")} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: "0.75rem",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer",
                    }}>
                      View <ChevronRight size={12} />
                    </button>
                    <button onClick={() => setDismissed(prev => new Set([...prev, alert.id]))} style={{
                      padding: "8px 10px", borderRadius: 10, background: "none",
                      border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)", cursor: "pointer",
                    }}>
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Promises */}
                {alert.promises.length > 0 && (
                  <div style={{ padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {alert.promises.map((p, i) => (
                      <span key={i} style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 6, background: "rgba(0,212,255,0.06)", color: "rgba(0,212,255,0.7)", border: "1px solid rgba(0,212,255,0.12)" }}>
                        📌 {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Draft panel */}
                {isExpanded && (
                  <div style={{ margin: "0 16px 16px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: "0.62rem", letterSpacing: "0.12em", color: "rgba(0,212,255,0.6)", textTransform: "uppercase", marginBottom: 10 }}>
                      ✉️ AI Draft — Review before sending
                    </div>
                    {isDrafting ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.3)", borderTopColor: "#00D4FF", animation: "spin 0.8s linear infinite" }} />
                        Writing personalised draft...
                      </div>
                    ) : hasDraft ? (
                      <>
                        <pre style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "0 0 14px", lineHeight: 1.6 }}>
                          {drafts[alert.id]}
                        </pre>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => navigator.clipboard.writeText(drafts[alert.id])}
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 10, fontSize: "0.78rem", background: "linear-gradient(135deg, #00D4FF, #8B5CF6)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                          >
                            <Send size={13} /> Copy & Send Manually
                          </button>
                          <button onClick={() => setExpanded(null)} style={{ padding: "9px 14px", borderRadius: 10, fontSize: "0.78rem", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                            Close
                          </button>
                        </div>
                        <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", marginTop: 10, marginBottom: 0 }}>
                          ⚠️ Nothing is sent automatically — copy and send this yourself.
                        </p>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
      </div>
    </div>
  );
}