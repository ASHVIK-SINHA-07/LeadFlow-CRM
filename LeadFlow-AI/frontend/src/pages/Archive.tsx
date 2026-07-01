import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArchive, getArchiveStats, reopenLead } from "../services/api";
import { Trophy, TrendingDown, Ghost, ChevronDown, ChevronUp, RotateCcw, Search, Filter } from "lucide-react";

type Deal = {
  id: number; name: string; company: string;
  outcome: "won" | "lost" | "ghosted";
  closeReason: string; closeTags: string[]; closedAt: string;
  warmthScore: number; daysSinceContact: number;
  promises: string[]; conversationHistory: string[]; baseScore: number;
};

export default function Archive() {
  const navigate = useNavigate();
  const [deals, setDeals]       = useState<Deal[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "won" | "lost" | "ghosted">("all");
  const [reopening, setReopening] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getArchive(), getArchiveStats()])
      .then(([d, s]) => { setDeals(d); setStats(s); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReopen = async (id: number) => {
    setReopening(id);
    await reopenLead(id);
    setReopening(null);
    load();
  };

  const outcomeColor = (o: string) =>
    o === "won" ? "#00FF88" : o === "lost" ? "#EF4444" : "#8B5CF6";

  const outcomeIcon = (o: string) =>
    o === "won" ? <Trophy size={13} /> : o === "lost" ? <TrendingDown size={13} /> : <Ghost size={13} />;

  const outcomeLabel = (o: string) =>
    o === "won" ? "Won" : o === "lost" ? "Lost" : "Ghosted";

  const filtered = deals.filter(d => {
    const matchFilter = filter === "all" || d.outcome === filter;
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.closeReason?.toLowerCase().includes(search.toLowerCase()) ||
      d.closeTags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ padding: "40px 40px 60px 280px", minHeight: "100vh", position: "relative", zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8F91A2", marginBottom: 8 }}>Records Vault</div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.5rem", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>Deal Archive</h1>
          <p style={{ color: "#8F91A2", fontSize: "0.95rem", marginTop: 6 }}>Complete history of every closed deal — read-only audit trail</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Win Rate", value: `${stats.winRate}%`, color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
              { label: "Won",      value: stats.won,           color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
              { label: "Lost",     value: stats.lost,          color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
              { label: "Ghosted",  value: stats.ghosted,       color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
            ].map(c => (
              <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)" }}>
                <div style={{ fontSize: "2.25rem", fontWeight: 700, color: c.color, fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>{c.value}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 550, color: "#8F91A2" }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search + filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8F91A2" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, reason, or tag..."
              style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px 10px 40px", color: "#F8FAFC", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Filter size={14} style={{ color: "#8F91A2" }} />
            {(["all", "won", "lost", "ghosted"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "8px 14px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
                cursor: "pointer", border: "none", transition: "all 0.15s",
                background: filter === f
                  ? f === "won" ? "rgba(34,197,94,0.12)" : f === "lost" ? "rgba(239,68,68,0.1)" : f === "ghosted" ? "rgba(139,92,246,0.1)" : "rgba(94,106,210,0.12)"
                  : "var(--surface)",
                color: filter === f
                  ? f === "won" ? "#22C55E" : f === "lost" ? "#EF4444" : f === "ghosted" ? "#8B5CF6" : "#5E6AD2"
                  : "#C8CAD5",
                outline: filter === f
                  ? `1px solid ${f === "won" ? "rgba(34,197,94,0.3)" : f === "lost" ? "rgba(239,68,68,0.25)" : f === "ghosted" ? "rgba(139,92,246,0.25)" : "rgba(94,106,210,0.3)"}`
                  : "1px solid var(--border)",
              }}>
                {f === "all" ? "All" : outcomeLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 90, borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", padding: "56px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(94,106,210,0.12)", display: "flex",
              alignItems: "center", justifyContent: "center", marginBottom: 18,
            }}>
              <Trophy size={30} style={{ color: "#5E6AD2" }} />
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#F8FAFC", marginBottom: 8 }}>
              {deals.length === 0 ? "No closed deals yet" : "No results match your search"}
            </div>
            <p style={{ fontSize: "0.9rem", color: "#C8CAD5", maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>
              {deals.length === 0 ? "Close a deal from the Leads page — it will appear here." : "Try a different search or filter."}
            </p>
            {deals.length === 0 && (
              <button
                onClick={() => navigate("/leads")}
                style={{
                  background: "#5E6AD2", border: "none", borderRadius: 8,
                  padding: "10px 20px", color: "#fff", fontWeight: 700, cursor: "pointer",
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 14px rgba(94, 106, 210, 0.4)",
                }}
              >
                Go to Pipeline
              </button>
            )}
          </div>
        )}

      {/* Deal list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(deal => {
            const isExpanded = expanded === deal.id;
            const color = outcomeColor(deal.outcome);

            return (
              <div key={deal.id} style={{
                borderRadius: 14,
                border: `1px solid ${isExpanded ? `${color}30` : "rgba(255,255,255,0.07)"}`,
                background: isExpanded ? `${color}06` : "rgba(255,255,255,0.02)",
                overflow: "hidden", transition: "all 0.2s",
              }}>
                {/* Header row */}
                <div onClick={() => setExpanded(isExpanded ? null : deal.id)} style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${color}12`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
                    {outcomeIcon(deal.outcome)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#F0F4FF" }}>{deal.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{deal.company}</span>
                      <span style={{ fontSize: "0.62rem", padding: "2px 8px", borderRadius: 99, fontWeight: 600, background: `${color}15`, color, border: `1px solid ${color}33`, display: "flex", alignItems: "center", gap: 4 }}>
                        {outcomeIcon(deal.outcome)} {outcomeLabel(deal.outcome)}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {(deal.closeTags ?? []).map(tag => (
                        <span key={tag} style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 99, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
                      {new Date(deal.closedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {isExpanded ? <ChevronUp size={15} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={15} color="rgba(255,255,255,0.3)" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: "0 20px 22px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {deal.closeReason && (
                      <div style={{ paddingTop: 18, marginBottom: 18 }}>
                        <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 7 }}>Close reason</div>
                        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>"{deal.closeReason}"</p>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", marginBottom: 10 }}>📌 Promises at close</div>
                        {deal.promises.length === 0
                          ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", margin: 0 }}>No open promises</p>
                          : deal.promises.map((p, i) => <p key={i} style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", margin: "0 0 5px", lineHeight: 1.5 }}>• {p}</p>)
                        }
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", marginBottom: 10 }}>📊 Deal metrics</div>
                        {[
                          { label: "Final warmth",  value: `${deal.warmthScore}/100`, color: deal.warmthScore >= 70 ? "#00FF88" : deal.warmthScore >= 40 ? "#F59E0B" : "#EF4444" },
                          { label: "Base score",    value: `${deal.baseScore}/100`,   color: "rgba(255,255,255,0.5)" },
                          { label: "Days inactive", value: `${deal.daysSinceContact}d`, color: "rgba(255,255,255,0.5)" },
                          { label: "Closed",        value: new Date(deal.closedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), color: "rgba(255,255,255,0.5)" },
                        ].map(m => (
                          <div key={m.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>{m.label}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: m.color }}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conversation history */}
                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                      <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", marginBottom: 12 }}>🧠 Full conversation history</div>
                      {deal.conversationHistory.length === 0
                        ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", margin: 0 }}>No notes recorded</p>
                        : deal.conversationHistory.map((note, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "rgba(0,212,255,0.6)", fontWeight: 700 }}>{i + 1}</div>
                            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6, padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, flex: 1 }}>{note}</p>
                          </div>
                        ))
                      }
                    </div>

                    {/* Reopen */}
                    <button onClick={() => handleReopen(deal.id)} disabled={reopening === deal.id} style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 18px", borderRadius: 10, fontSize: "0.78rem", fontWeight: 600,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.45)", cursor: "pointer",
                      opacity: reopening === deal.id ? 0.5 : 1,
                    }}>
                      <RotateCcw size={13} />
                      {reopening === deal.id ? "Reopening..." : "Reopen deal"}
                    </button>
                    <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.15)", marginTop: 8, marginBottom: 0 }}>
                      Reopening moves this deal back to active pipeline as Warm.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    </div>
  );
}