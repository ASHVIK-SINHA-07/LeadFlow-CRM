import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, getLeads, createLead, getAlerts } from "../services/api";
import { TrendingDown, Clock, CheckSquare, Users, X, Plus, ChevronRight, AlertTriangle } from "lucide-react";

type Stats = { total: number; hot: number; warm: number; cold: number; overdueFollowUps: number; totalPromises: number; };
type Lead = { id: number; name: string; company: string; warmthScore: number; status: string; daysSinceContact: number; overdueFollowUp: boolean; promises: string[]; };

function WarmthBar({ score }: { score: number }) {
  const color = score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`,
          background: color, borderRadius: 99,
          transition: "width 0.6s ease",
        }} />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 600, color, minWidth: 22, textAlign: "right" }}>{score}</span>
    </div>
  );
}

const CARD_ICONS = [Users, TrendingDown, Clock, CheckSquare];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ name: "", company: "", score: "60", promises: "" });
  const [saving, setSaving]       = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const refresh = () => {
    getDashboard().then(setStats);
    getLeads().then(setLeads);
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    getAlerts().then(d => setAlertCount(d.alerts?.length ?? 0));
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.company) return;
    setSaving(true);
    await createLead({ name: form.name, company: form.company, score: Number(form.score), promises: form.promises });
    setForm({ name: "", company: "", score: "60", promises: "" });
    setShowModal(false);
    setSaving(false);
    refresh();
  };

  const priorityQueue = [...leads].sort((a, b) => a.warmthScore - b.warmthScore).slice(0, 5);
  const overdueCount  = leads.filter(l => l.overdueFollowUp).length;

  const statCards = [
    { label: "Total Leads",        value: stats?.total ?? 0,            icon: Users,       },
    { label: "Hot Leads",          value: stats?.hot ?? 0,              icon: TrendingDown },
    { label: "Overdue Follow-ups", value: stats?.overdueFollowUps ?? 0, icon: Clock        },
    { label: "Open Promises",      value: stats?.totalPromises ?? 0,    icon: CheckSquare  },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#18181B",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "9px 13px",
    color: "#F4F4F5",
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "Inter, sans-serif",
  };

  const CHIP_COLORS = [
    { bg: "rgba(94, 106, 210, 0.16)", text: "#5E6AD2" },
    { bg: "rgba(239, 68, 68, 0.16)", text: "#EF4444" },
    { bg: "rgba(245, 158, 11, 0.16)", text: "#F59E0B" },
    { bg: "rgba(34, 197, 94, 0.16)", text: "#22C55E" },
  ];

  return (
    <div style={{ padding: "40px 40px 60px 280px", minHeight: "100vh", position: "relative", zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8F91A2", marginBottom: 8 }}>
              Dashboard
            </div>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.5rem", fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
              Pipeline Overview
            </h1>
            <p style={{ color: "#8F91A2", fontSize: "0.95rem", marginTop: 6 }}>
              Lead scores decay 3 pts/day · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#5E6AD2", border: "none", borderRadius: 8,
                padding: "10px 20px", color: "#fff",
                fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                transition: "background 0.15s",
                boxShadow: "0 4px 14px rgba(94, 106, 210, 0.4)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#4F5BBD")}
              onMouseLeave={e => (e.currentTarget.style.background = "#5E6AD2")}
            >
              <Plus size={15} /> Add Lead
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {statCards.map((card, i) => {
            const Icon = CARD_ICONS[i];
            const chip = CHIP_COLORS[i];
            return (
              <div key={card.label} style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14, padding: 24,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: chip.bg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  marginBottom: 16, color: chip.text
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ fontSize: "2.25rem", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#F8FAFC", letterSpacing: "-0.02em", marginBottom: 6 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 550, color: "#8F91A2" }}>{card.label}</div>
              </div>
            );
          })}
        </div>

        {/* Today's Priority Queue */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", marginBottom: 32 }}>

          {/* Section header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#F8FAFC" }}>Today's Priority Queue</div>
              <div style={{ fontSize: "0.8rem", color: "#8F91A2", marginTop: 4 }}>
                {overdueCount > 0
                  ? <span style={{ color: "#EF4444", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} /> {overdueCount} lead{overdueCount > 1 ? "s" : ""} overdue — contact today
                    </span>
                  : "All leads within follow-up window"}
              </div>
            </div>
            {alertCount > 0 && (
              <button
                onClick={() => navigate("/alerts")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8, padding: "8px 14px",
                  color: "#EF4444", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                <AlertTriangle size={13} /> {alertCount} alert{alertCount > 1 ? "s" : ""} <ChevronRight size={12} />
              </button>
            )}
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 140px 130px 110px 80px",
            gap: 12, padding: "12px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            {["#", "Lead", "Warmth", "Last Contact", "Promises", ""].map(h => (
              <div key={h} style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8F91A2", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div>
            {priorityQueue.length === 0 && (
              <div style={{ padding: "56px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(94, 106, 210, 0.12)", display: "flex",
                  alignItems: "center", justifyContent: "center", marginBottom: 18,
                }}>
                  <Users size={32} style={{ color: "#5E6AD2" }} />
                </div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#F8FAFC", marginBottom: 8 }}>No Active Leads</div>
                <p style={{ fontSize: "0.9rem", color: "#C8CAD5", maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>
                  Start by adding your first lead manually to activate your priority queue and start tracking deals.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: "#5E6AD2", border: "none", borderRadius: 8,
                    padding: "10px 20px", color: "#fff", fontWeight: 700, cursor: "pointer",
                    fontSize: "0.85rem",
                    boxShadow: "0 4px 14px rgba(94, 106, 210, 0.4)",
                  }}
                >
                  Add Your First Lead
                </button>
              </div>
            )}

            {priorityQueue.map((lead, idx) => {
            const isOverdue    = lead.overdueFollowUp;
            const promisesCount = Array.isArray(lead.promises) ? lead.promises.length : 0;
            return (
              <div
                key={lead.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 140px 130px 90px 80px",
                  gap: 12, padding: "13px 20px",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isOverdue ? "rgba(239,68,68,0.03)" : "transparent",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = isOverdue ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = isOverdue ? "rgba(239,68,68,0.03)" : "transparent")}
              >
                {/* Rank */}
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: "0.7rem", fontWeight: 600,
                  color: idx === 0 ? "#EF4444" : "#71717A",
                }}>
                  {idx + 1}
                </div>

                {/* Name + company */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.8375rem", fontWeight: 500, color: "#F4F4F5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#71717A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.company}</div>
                </div>

                {/* Warmth bar */}
                <WarmthBar score={lead.warmthScore} />

                {/* Days since contact */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={11} style={{ color: isOverdue ? "#EF4444" : "#52525B", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.775rem", color: isOverdue ? "#EF4444" : "#71717A" }}>
                    {lead.daysSinceContact === 0 ? "Today" : `${lead.daysSinceContact}d ago`}
                  </span>
                </div>

                {/* Promises badge */}
                <div>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 500,
                    padding: "2px 8px", borderRadius: 99,
                    background: promisesCount > 0 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
                    color: promisesCount > 0 ? "#F59E0B" : "#52525B",
                  }}>
                    {promisesCount} promise{promisesCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Brief Me */}
                <button
                  onClick={() => navigate(`/brief?lead=${lead.id}`)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 6, padding: "5px 10px",
                    color: "#A1A1AA", fontSize: "0.72rem", fontWeight: 500,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                    whiteSpace: "nowrap", transition: "border-color 0.12s, color 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#5E6AD2"; e.currentTarget.style.color = "#5E6AD2"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#A1A1AA"; }}
                >
                  Brief <ChevronRight size={10} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* + New Lead Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          backdropFilter: "blur(4px)",
          animation: "fade-in 0.15s ease",
        }}>
          <div style={{
            background: "#111113", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: 28, width: 420, position: "relative",
            animation: "slide-up 0.15s ease",
          }}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#52525B", cursor: "pointer" }}>
              <X size={18} />
            </button>
            <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#52525B", marginBottom: 6 }}>New Lead</div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#F4F4F5", marginBottom: 22, letterSpacing: "-0.01em" }}>Add lead manually</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Full name", placeholder: "Rohit Sharma", key: "name" as const },
                { label: "Company",   placeholder: "Infosys",      key: "company" as const },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: "0.775rem", color: "#71717A", display: "block", marginBottom: 6 }}>{field.label}</label>
                  <input
                    style={inputStyle}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "0.775rem", color: "#71717A", display: "block", marginBottom: 6 }}>Initial score (0–100)</label>
                <input style={inputStyle} type="number" min="0" max="100" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.775rem", color: "#71717A", display: "block", marginBottom: 6 }}>First promise / note</label>
                <input style={inputStyle} placeholder="Send proposal by Friday" value={form.promises} onChange={e => setForm(f => ({ ...f, promises: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, background: "none", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 8, padding: "9px", color: "#71717A", cursor: "pointer", fontSize: "0.8375rem",
              }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving || !form.name || !form.company} style={{
                flex: 2, background: "#5E6AD2", border: "none", borderRadius: 8,
                padding: "9px", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.8375rem",
                opacity: saving || !form.name || !form.company ? 0.5 : 1,
                transition: "background 0.15s",
              }}>
                {saving ? "Saving…" : "Add Lead"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}