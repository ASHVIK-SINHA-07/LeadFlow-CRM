import { useEffect, useState } from "react";
import { getLeads, draftFollowUp, markPromiseDone, addNote, closeDeal, recallPromises, getPreCallBrief } from "../services/api";
import { Zap, CheckCircle, Mail, MessageSquare, Trophy, X, TrendingDown, Ghost, Brain, Phone, Target, AlertOctagon, Mic } from "lucide-react";

type Lead = {
  id: number; name: string; company: string;
  warmthScore: number; status: string;
  daysSinceContact: number; overdueFollowUp: boolean;
  promises: string[]; conversationHistory: string[];
  followUpDraft?: string;
};

type TimelineEntry = {
  id: string;
  type: "note" | "ai_draft" | "promise_done" | "warmth_event" | "lead_created";
  content: string;
  timestamp: Date;
};


function buildTimeline(lead: Lead, draftText: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Seed entries from conversationHistory — each is a manual note
  lead.conversationHistory.forEach((note, i) => {
    // Detect special auto-logged entries by prefix
    const isWarmthEvent  = note.startsWith("Warmth");
    const isPromiseDone  = note.startsWith("Promise completed:");
    const isDraftSent    = note.startsWith("AI draft sent:");
    const isCreated      = note === "Lead added manually" || note === "Deal reopened — returning to active pipeline.";

    const type: TimelineEntry["type"] =
      isWarmthEvent  ? "warmth_event"  :
      isPromiseDone  ? "promise_done"  :
      isDraftSent    ? "ai_draft"      :
      isCreated      ? "lead_created"  :
      "note";

    // Approximate timestamp — oldest entries get earlier dates
    const approxTime = new Date(
      Date.now() - (lead.conversationHistory.length - i) * 24 * 60 * 60 * 1000
    );

    entries.push({ id: `hist-${i}`, type, content: note, timestamp: approxTime });
  });

  // Add a synthetic warmth event if score is declining
  if (lead.warmthScore < 50 && lead.daysSinceContact > 3) {
    entries.push({
      id: "warmth-auto",
      type: "warmth_event",
      content: `Warmth decayed to ${lead.warmthScore} — ${lead.daysSinceContact} days without contact`,
      timestamp: new Date(Date.now() - lead.daysSinceContact * 60 * 60 * 1000),
    });
  }

  // Add live draft as latest entry if it exists
  if (draftText) {
    entries.push({
      id: "draft-live",
      type: "ai_draft",
      content: `AI draft generated: ${draftText.slice(0, 80)}...`,
      timestamp: new Date(),
    });
  }

  // Sort chronologically, newest last
  entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return entries;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}


export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteBox, setShowNoteBox] = useState(false);

  // ── Inline AI Action Panel ──────────────────────────────────────────────
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
  const [panelOutput, setPanelOutput] = useState<Record<number, string>>({});
  const [panelLoading, setPanelLoading] = useState<Record<number, "recall" | "brief" | "draft" | null>>({});
  const [panelCopied, setPanelCopied] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) =>
    setExpandedLeadId(prev => (prev === id ? null : id));

  const runPanelAction = async (
    lead: Lead,
    action: "recall" | "brief" | "draft"
  ) => {
    setPanelLoading(p => ({ ...p, [lead.id]: action }));
    setPanelOutput(p => ({ ...p, [lead.id]: "" }));
    try {
      let result: any;
      if (action === "recall")  result = await recallPromises(lead.id);
      else if (action === "brief")  result = await getPreCallBrief(lead.id);
      else                          result = await draftFollowUp(lead.id);
      // Normalise: APIs return different shapes
      const text =
        typeof result === "string"
          ? result
          : result?.draft ?? result?.brief ?? result?.summary ??
            result?.promises ?? JSON.stringify(result, null, 2);
      setPanelOutput(p => ({ ...p, [lead.id]: typeof text === "string" ? text : JSON.stringify(text, null, 2) }));
    } catch (e: any) {
      setPanelOutput(p => ({ ...p, [lead.id]: `Error: ${e?.message ?? "Request failed"}` }));
    } finally {
      setPanelLoading(p => ({ ...p, [lead.id]: null }));
    }
  };

  const copyPanelOutput = (leadId: number) => {
    const text = panelOutput[leadId] ?? "";
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setPanelCopied(p => ({ ...p, [leadId]: true }));
      setTimeout(() => setPanelCopied(p => ({ ...p, [leadId]: false })), 2000);
    });
  };
  // ───────────────────────────────────────────────────────────────────────

  const [showCloseModal, setShowCloseModal] = useState(false);
const [closingLead, setClosingLead] = useState<Lead | null>(null);
const [closeOutcome, setCloseOutcome] = useState<"won" | "lost" | "ghosted">("won");
const [closeReason, setCloseReason] = useState("");
const [closeLoading, setCloseLoading] = useState(false);

const [recallData, setRecallData]     = useState<any>(null);
const [recallLoading, setRecallLoading] = useState(false);
const [showRecall, setShowRecall]     = useState(false);


const [showBrief,    setShowBrief]    = useState(false);
const [briefData,    setBriefData]    = useState<any>(null);
const [briefLoading, setBriefLoading] = useState(false);
const [callTimer,    setCallTimer]    = useState<number | null>(null);
const [callSeconds,  setCallSeconds]  = useState(0);

const handlePreCallBrief = async (lead: Lead) => {
  setSelectedLead(lead);
  setShowBrief(true);
  setBriefData(null);
  setBriefLoading(true);
  const result = await getPreCallBrief(lead.id);
  setBriefData(result);
  setBriefLoading(false);
};

const startCallTimer = () => {
  setCallSeconds(0);
  const interval = window.setInterval(() => setCallSeconds(s => s + 1), 1000);
  setCallTimer(interval);
};

const stopCallTimer = () => {
  if (callTimer !== null) { clearInterval(callTimer); setCallTimer(null); }
};

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const handleRecall = async (lead: Lead) => {
  setSelectedLead(lead);
  setShowRecall(true);
  setRecallData(null);
  setRecallLoading(true);
  const result = await recallPromises(lead.id);
  setRecallData(result);
  setRecallLoading(false);
};

const handleClose = (lead: Lead) => {
  setClosingLead(lead);
  setCloseOutcome("won");
  setCloseReason("");
  setShowCloseModal(true);
};

const submitClose = async () => {
  if (!closingLead) return;
  setCloseLoading(true);
  await closeDeal(closingLead.id, closeOutcome, closeReason);
  setCloseLoading(false);
  setShowCloseModal(false);
  setClosingLead(null);
  setSelectedLead(null);
  refresh();
};

  const refresh = () => getLeads().then(setLeads).finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

 
 
  const handleDraft = async (lead: Lead) => {
  setSelectedLead(lead); setDraft(""); setDraftLoading(true);
  const result = await draftFollowUp(lead.id);
  setDraft(result.draft); setDraftLoading(false);
  // Auto-log to timeline
  await addNote(lead.id, `AI draft sent: ${result.draft.slice(0, 60)}...`);
  refresh();
  };

  
  
  const handlePromiseDone = async (lead: Lead, promise: string) => {
  await markPromiseDone(lead.id, promise);
  await addNote(lead.id, `Promise completed: "${promise}"`);
  refresh();
  };

  const handleAddNote = async () => {
    if (!selectedLead || !note.trim()) return;
    await addNote(selectedLead.id, note);
    setNote(""); setShowNoteBox(false); refresh();
  };

  const scoreColor = (score: number) =>
score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";

  if (loading) return <p style={{ color: "#71717A", padding: 32 }}>Loading leads…</p>;


  return (
    <div style={{ padding: "40px 40px 60px 280px", minHeight: "100vh", position: "relative", zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8F91A2", marginBottom: 8 }}>Leads</div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "2.5rem", fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em" }}>Your Pipeline</h1>
          <p style={{ color: "#8F91A2", fontSize: "0.95rem", marginTop: 6 }}>Sorted by urgency · Score decays 3 pts/day</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selectedLead ? "1fr 420px" : "1fr", gap: 24 }}>
          {/* Lead list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {leads.map(lead => {
              const isExpanded = expandedLeadId === lead.id;
              const activePanelLoad = panelLoading[lead.id] ?? null;
              const panelText = panelOutput[lead.id] ?? "";
              const isCopied = panelCopied[lead.id] ?? false;

              return (
                <div key={lead.id}>
                  {/* ── Lead card row ── */}
                  <div
                    onClick={() => { setSelectedLead(lead); toggleExpand(lead.id); }}
                    style={{
                      background: lead.overdueFollowUp ? "rgba(239,68,68,0.04)" : "var(--surface)",
                      border: `1px solid ${isExpanded ? "rgba(255,255,255,0.15)" : selectedLead?.id === lead.id ? "rgba(255,255,255,0.12)" : lead.overdueFollowUp ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                      borderRadius: isExpanded ? "14px 14px 0 0" : 14,
                      padding: "20px 24px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all 0.15s",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#F8FAFC" }}>{lead.name}</span>
                        <span style={{ fontSize: "0.8rem", color: "#8F91A2" }}>{lead.company}</span>
                        {lead.overdueFollowUp && (
                          <span style={{ fontSize: "0.68rem", background: "rgba(239,68,68,0.12)", color: "#EF4444", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                            OVERDUE {lead.daysSinceContact}d
                          </span>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#8F91A2", userSelect: "none" }}>
                          {isExpanded ? "▲ collapse" : "▼ expand"}
                        </span>
                      </div>
                    {/* Promises */}
                    {lead.promises.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {lead.promises.slice(0, 2).map((p, i) => (
                          <span key={i} style={{ fontSize: "0.7rem", color: "#5E6AD2", background: "rgba(94,106,210,0.08)", padding: "2px 8px", borderRadius: 5 }}>
                            · {p}
                          </span>
                        ))}
                        {lead.promises.length > 2 && <span style={{ fontSize: "0.7rem", color: "#52525B" }}>+{lead.promises.length - 2} more</span>}
                      </div>
                    )}
                  </div>

                  {/* Warmth score */}
                  <div style={{ textAlign: "center", marginLeft: 20 }}>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: scoreColor(lead.warmthScore) }}>
                      {lead.warmthScore}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>warmth</div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
                    <button onClick={e => { e.stopPropagation(); handlePreCallBrief(lead); }} style={{
                      background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 7, padding: "6px 12px", color: "#A1A1AA", fontSize: "0.72rem",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Phone size={12} /> Brief
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleRecall(lead); }} style={{
                      background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 7, padding: "6px 12px", color: "#A1A1AA", fontSize: "0.72rem",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Brain size={12} /> Recall
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDraft(lead); }} style={{
                      background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 7, padding: "6px 12px", color: "#A1A1AA", fontSize: "0.72rem",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Mail size={12} /> Draft
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleClose(lead); }} style={{
                      background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)",
                      borderRadius: 7, padding: "6px 12px", color: "#22C55E", fontSize: "0.72rem",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Trophy size={12} /> Close
                    </button>
                  </div>
                </div>

                {/* ── AI Action Panel (expanded) ── */}
                {isExpanded && (
                  <div style={{
                    background: "#0D0D0F",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: "0 0 10px 10px",
                    padding: "14px 18px",
                  }}>
                    {/* 3 action buttons */}
                    <div style={{ display: "flex", gap: 10, marginBottom: panelText ? 14 : 0 }}>
                      {([
                        { key: "recall" as const, emoji: "🧠", label: "Recall Promises",  color: "#A1A1AA", bg: "rgba(255,255,255,0.04)",  border: "rgba(255,255,255,0.08)" },
                        { key: "brief"  as const, emoji: "📞", label: "Pre-Call Brief",   color: "#A1A1AA", bg: "rgba(255,255,255,0.04)",  border: "rgba(255,255,255,0.08)" },
                        { key: "draft"  as const, emoji: "✉️", label: "Draft Follow-up",  color: "#A1A1AA", bg: "rgba(255,255,255,0.04)",  border: "rgba(255,255,255,0.08)" },
                      ]).map(({ key, emoji, label, color, bg, border }) => (
                        <button
                          key={key}
                          disabled={activePanelLoad !== null}
                          onClick={e => { e.stopPropagation(); runPanelAction(lead, key); }}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                            background: activePanelLoad === key ? `${bg}` : bg,
                            border: `1px solid ${border}`,
                            borderRadius: 10, padding: "10px 0",
                            color, fontSize: "0.78rem", fontWeight: 600,
                            cursor: activePanelLoad !== null ? "not-allowed" : "pointer",
                            opacity: activePanelLoad !== null && activePanelLoad !== key ? 0.4 : 1,
                            transition: "opacity 0.15s",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {activePanelLoad === key ? (
                            <span style={{ letterSpacing: "0.15em" }}>...</span>
                          ) : (
                            <>{emoji} {label}</>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Output box */}
                    {panelText && (
                      <div style={{ position: "relative" }}>
                        {/* Copy button */}
                        <button
                          onClick={e => { e.stopPropagation(); copyPanelOutput(lead.id); }}
                          style={{
                            position: "absolute", top: 10, right: 10,
                            background: isCopied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${isCopied ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 5, padding: "3px 9px",
                            color: isCopied ? "#22C55E" : "#71717A",
                            fontSize: "0.65rem", fontWeight: 500, cursor: "pointer",
                            transition: "all 0.2s", zIndex: 1,
                          }}
                        >
                          {isCopied ? "✓ Copied" : "Copy"}
                        </button>

                        <div style={{
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: 8, padding: 14,
                          color: "#D4D4D8", fontSize: "0.8125rem",
                          maxHeight: 200, overflowY: "auto",
                          whiteSpace: "pre-wrap", lineHeight: 1.6,
                          paddingRight: 56,
                        }}>
                          {panelText}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedLead && (
          <div style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 20, height: "fit-content", position: "sticky", top: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#F4F4F5", marginBottom: 3, letterSpacing: "-0.01em" }}>{selectedLead.name}</h3>
              <p style={{ fontSize: "0.775rem", color: "#71717A" }}>{selectedLead.company} · {selectedLead.daysSinceContact}d ago</p>
            </div>

            {/* Promises */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#52525B", marginBottom: 10 }}>Open Promises</div>
              {selectedLead.promises.length === 0
                ? <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}>No open promises</p>
                : selectedLead.promises.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>{p}</span>
                    <button onClick={() => handlePromiseDone(selectedLead, p)} style={{ background: "none", border: "none", color: "#22C55E", cursor: "pointer" }}>
                      <CheckCircle size={16} />
                    </button>
                  </div>
                ))
              }
            </div>

           {/* ── Conversation Timeline ── */}
<div style={{ marginBottom: 20 }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
    <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#52525B" }}>
      Conversation Log
    </div>
    <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)" }}>
      {buildTimeline(selectedLead, draft).length} entries
    </span>
  </div>

  <div style={{ position: "relative" }}>
    {/* Vertical line */}
    <div style={{
      position: "absolute", left: 11, top: 8, bottom: 8,
      width: 1, background: "rgba(255,255,255,0.06)",
    }} />

    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {buildTimeline(selectedLead, draft).map((entry, i, arr) => {
        const isLast = i === arr.length - 1;

        const typeConfig = {
          note:          { dot: "#5E6AD2", label: "Note",          bg: "rgba(94,106,210,0.06)",   border: "rgba(94,106,210,0.12)"   },
          ai_draft:      { dot: "#A1A1AA", label: "AI Draft",      bg: "rgba(255,255,255,0.03)",  border: "rgba(255,255,255,0.08)"  },
          promise_done:  { dot: "#22C55E", label: "Promise Done",  bg: "rgba(34,197,94,0.05)",   border: "rgba(34,197,94,0.12)"   },
          warmth_event:  { dot: "#F59E0B", label: "Warmth",        bg: "rgba(245,158,11,0.05)",  border: "rgba(245,158,11,0.12)"  },
          lead_created:  { dot: "rgba(255,255,255,0.2)", label: "Created", bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)" },
        }[entry.type];

        return (
          <div key={entry.id} style={{ display: "flex", gap: 12, paddingBottom: isLast ? 0 : 14 }}>
            {/* Dot on the line */}
            <div style={{ position: "relative", flexShrink: 0, width: 23, display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 9, height: 9, borderRadius: "50%", marginTop: 5,
                background: typeConfig.dot,
                boxShadow: "none",
                border: `1px solid ${typeConfig.dot}`,
                zIndex: 1, position: "relative",
                flexShrink: 0,
              }} />
            </div>

            {/* Entry card */}
            <div style={{
              flex: 1, background: typeConfig.bg,
              border: `1px solid ${typeConfig.border}`,
              borderRadius: 10, padding: "8px 12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{
                  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: typeConfig.dot,
                }}>
                  {typeConfig.label}
                </span>
                <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)" }}>
                  {relativeTime(entry.timestamp)}
                </span>
              </div>
              <p style={{
                fontSize: "0.77rem", color: "rgba(255,255,255,0.55)",
                margin: 0, lineHeight: 1.5,
              }}>
                {entry.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
</div>
            </div>

            {/* Add note */}
            <div style={{ marginBottom: 20 }}>
              {!showNoteBox
                ? <button onClick={() => setShowNoteBox(true)} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", cursor: "pointer" }}>
                    <MessageSquare size={13} style={{ display: "inline", marginRight: 6 }} /> Add conversation note
                  </button>
                : <div>
                    <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                      placeholder="What happened in this conversation?"
                      style={{ width: "100%", background: "#18181B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 10, color: "#F4F4F5", fontSize: "0.82rem", resize: "none", outline: "none" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={handleAddNote} style={{ flex: 1, background: "rgba(94,106,210,0.1)", border: "1px solid rgba(94,106,210,0.2)", borderRadius: 7, padding: "7px", color: "#5E6AD2", cursor: "pointer", fontSize: "0.8rem", fontFamily: "Inter, sans-serif" }}>Save Note</button>
                      <button onClick={() => setShowNoteBox(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 12px", color: "#71717A", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                    </div>
                  </div>
              }
            </div>

            {/* Follow-up draft */}
            {(draft || draftLoading) && (
              <div style={{ background: "rgba(94,106,210,0.05)", border: "1px solid rgba(94,106,210,0.12)", borderRadius: 9, padding: 14 }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5E6AD2", marginBottom: 8 }}>AI Draft</div>
                {draftLoading
                  ? <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>Writing draft...</p>
                  : <pre style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{draft}</pre>
                }
              </div>
            )}

            <button onClick={() => handleDraft(selectedLead)} style={{
              marginTop: 12, width: "100%", background: "#5E6AD2",
              border: "none", borderRadius: 8, padding: "10px", color: "#fff",
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
            }}>
              <Zap size={14} style={{ display: "inline", marginRight: 6 }} />
              {draftLoading ? "Drafting..." : "1-Click Follow-up Draft"}
            </button>
          </div>
        )}
      </div>


      
      {/* ── Pre-Call Brief Modal ── */}
{showBrief && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  }}>
    <div style={{
      background: "#111113", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14, padding: 28, width: "100%", maxWidth: 600,
      maxHeight: "88vh", overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: "rgba(94,106,210,0.1)", border: "1px solid rgba(94,106,210,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Phone size={16} color="#5E6AD2" />
          </div>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#52525B", marginBottom: 3 }}>Pre-Call Brief</div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#F0F4FF", margin: 0 }}>
              {briefData?.leadName ?? selectedLead?.name} · {briefData?.company ?? selectedLead?.company}
            </h2>
            {briefData && (
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>
                Warmth {briefData.warmthScore} · Last contact {briefData.daysSince}d ago ·{" "}
                <span style={{ color: briefData.warmthTrend === "stable" ? "#22C55E" : briefData.warmthTrend === "declining" ? "#F59E0B" : "#EF4444" }}>
                  {briefData.warmthTrend === "stable" ? "▲ Stable" : briefData.warmthTrend === "declining" ? "▼ Declining" : "⚠ Critical"}
                </span>
              </p>
            )}
          </div>
        </div>
        <button onClick={() => { setShowBrief(false); setBriefData(null); stopCallTimer(); }}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      {/* Loading */}
      {briefLoading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", margin: "0 auto 16px",
            border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#5E6AD2",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
            AI is reading your history with {selectedLead?.name}...
          </p>
        </div>
      )}

      {/* Content */}
      {briefData && !briefLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Call timer */}
          <div style={{
            background: callTimer !== null ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${callTimer !== null ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 9, padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "all 0.3s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Mic size={15} color={callTimer !== null ? "#22C55E" : "#52525B"} />
              <span style={{ fontSize: "0.83rem", color: callTimer !== null ? "#22C55E" : "#71717A" }}>
                {callTimer !== null ? `On call — ${formatTime(callSeconds)}` : "Call timer"}
              </span>
            </div>
            {callTimer === null ? (
              <button onClick={startCallTimer} style={{
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 7, padding: "6px 12px", color: "#22C55E",
                fontSize: "0.75rem", cursor: "pointer", fontWeight: 500,
              }}>Start call</button>
            ) : (
              <button onClick={() => { stopCallTimer(); setShowBrief(false); setBriefData(null); setShowNoteBox(true); }} style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, padding: "6px 14px", color: "#EF4444",
                fontSize: "0.75rem", cursor: "pointer", fontWeight: 600,
              }}>End call → Add note</button>
            )}
          </div>

          {/* Suggested opener */}
          <div style={{ background: "rgba(94,106,210,0.05)", border: "1px solid rgba(94,106,210,0.15)", borderRadius: 9, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5E6AD2", marginBottom: 7 }}>Open with this</div>
            <p style={{ fontSize: "0.9rem", color: "#F0F4FF", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>"{briefData.suggestedOpener}"</p>
          </div>

          {/* Main objective */}
          <div style={{ background: "rgba(94,106,210,0.05)", border: "1px solid rgba(94,106,210,0.12)", borderRadius: 9, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Target size={14} color="#5E6AD2" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5E6AD2", marginBottom: 4 }}>Main objective</div>
              <p style={{ fontSize: "0.85rem", color: "#F0F4FF", margin: 0, lineHeight: 1.5 }}>{briefData.mainObjective}</p>
            </div>
          </div>

          {/* Last discussed + objections */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>🕐 Last discussed</div>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{briefData.lastDiscussed}</p>
            </div>
            <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(239,68,68,0.6)", textTransform: "uppercase", marginBottom: 8 }}>🚧 Objections</div>
              {briefData.objections?.length > 0
                ? briefData.objections.map((o: string, i: number) => <p key={i} style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>• {o}</p>)
                : <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)", margin: 0 }}>None recorded</p>
              }
            </div>
          </div>

          {/* Talking points */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>📋 Talking points</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {briefData.talkingPoints?.map((pt: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.62rem", color: "#71717A", fontWeight: 600,
                  }}>{i + 1}</span>
                  <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5 }}>{pt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open promises */}
          {briefData.openPromises?.length > 0 && (
            <div style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 14, padding: "14px 18px" }}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(245,158,11,0.6)", textTransform: "uppercase", marginBottom: 10 }}>📌 Open promises</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {briefData.openPromises.map((p: string, i: number) => (
                  <span key={i} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: 8, background: "rgba(245,158,11,0.08)", color: "rgba(245,158,11,0.8)", border: "1px solid rgba(245,158,11,0.2)" }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {briefData.risksToAvoid?.length > 0 && (
            <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 14, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <AlertOctagon size={13} color="rgba(239,68,68,0.7)" />
                <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(239,68,68,0.6)", textTransform: "uppercase" }}>Don't do this</div>
              </div>
              {briefData.risksToAvoid.map((r: string, i: number) => (
                <p key={i} style={{ fontSize: "0.8rem", color: "rgba(255,100,100,0.6)", margin: "0 0 4px", lineHeight: 1.5 }}>⚠ {r}</p>
              ))}
            </div>
          )}

          {/* Footer CTA */}
          <button
            onClick={() => { setShowBrief(false); setBriefData(null); stopCallTimer(); setShowNoteBox(true); }}
            style={{
              width: "100%", background: "#5E6AD2",
              border: "none", borderRadius: 9, padding: "11px",
              color: "#fff", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            <MessageSquare size={14} /> Done — Add call note
          </button>
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  </div>
)}

      {/* ── Memory Recall Modal ── */}
{showRecall && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  }}>
    <div style={{
      background: "#111113",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14, padding: 28, width: "100%", maxWidth: 560,
      maxHeight: "80vh", overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={16} color="#A1A1AA" />
          </div>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#52525B", marginBottom: 2 }}>Memory Recall</div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#F0F4FF", margin: 0 }}>
              What did I promise {recallData?.leadName ?? selectedLead?.name}?
            </h2>
            {recallData && (
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
                {recallData.company} · Last contact {recallData.daysSince}d ago · Warmth {recallData.warmthScore}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => { setShowRecall(false); setRecallData(null); }}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      {/* Loading */}
      {recallLoading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", margin: "0 auto 16px",
            border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#5E6AD2",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
            Reading all conversations and promises...
          </p>
        </div>
      )}

      {/* Results */}
      {recallData && !recallLoading && (
        <>
          {/* AI summary */}
          <div style={{
            background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 24,
          }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(139,92,246,0.6)", textTransform: "uppercase", marginBottom: 6 }}>
              🧠 AI Memory Summary
            </div>
            <p style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
              {recallData.summary}
            </p>
          </div>

          {/* Promises list */}
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>
            📌 All Promises Found ({recallData.promises?.length ?? 0})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recallData.promises?.map((p: any, i: number) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${p.urgency === "high" ? "rgba(239,68,68,0.25)" : p.urgency === "medium" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "14px 16px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.85rem", color: "#F0F4FF", margin: "0 0 8px", lineHeight: 1.5 }}>{p.text}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.65rem", padding: "2px 8px", borderRadius: 99, fontWeight: 600,
                      background: p.urgency === "high" ? "rgba(239,68,68,0.12)" : p.urgency === "medium" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)",
                      color: p.urgency === "high" ? "#EF4444" : p.urgency === "medium" ? "#F59E0B" : "rgba(255,255,255,0.3)",
                      border: `1px solid ${p.urgency === "high" ? "rgba(239,68,68,0.25)" : p.urgency === "medium" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                      {p.urgency === "high" ? "🔴 High urgency" : p.urgency === "medium" ? "🟡 Medium" : "🔵 Low"}
                    </span>
                    <span style={{
                      fontSize: "0.65rem", padding: "2px 8px", borderRadius: 99,
                      background: p.source === "explicit" ? "rgba(0,212,255,0.06)" : "rgba(139,92,246,0.08)",
                      color: p.source === "explicit" ? "rgba(0,212,255,0.6)" : "rgba(139,92,246,0.6)",
                      border: `1px solid ${p.source === "explicit" ? "rgba(0,212,255,0.15)" : "rgba(139,92,246,0.15)"}`,
                    }}>
                      {p.source === "explicit" ? "📋 Explicit" : "🔍 Inferred"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!selectedLead) return;
                    await markPromiseDone(selectedLead.id, p.text);
                    setRecallData((prev: any) => ({
                      ...prev,
                      promises: prev.promises.filter((_: any, idx: number) => idx !== i),
                    }));
                    refresh();
                  }}
                  style={{
                    background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)",
                    borderRadius: 8, padding: "6px 10px", color: "#00FF88",
                    cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                    fontSize: "0.72rem",
                  }}
                >
                  <CheckCircle size={13} /> Done
                </button>
              </div>
            ))}
          </div>

          {recallData.promises?.length > 0 && (
            <button
              onClick={() => { setShowRecall(false); if (selectedLead) handleDraft(selectedLead); }}
              style={{
                marginTop: 20, width: "100%",
                background: "linear-gradient(135deg, #8B5CF6, #00D4FF)",
                border: "none", borderRadius: 12, padding: "13px",
                color: "#fff", fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Zap size={14} /> Draft follow-up addressing all promises
            </button>
          )}
        </>
      )}
    </div>
  </div>
)}
      {showCloseModal && closingLead && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  }}>
    <div style={{
      background: "rgba(8,10,15,0.98)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 20, padding: 32, width: "100%", maxWidth: 480,
      boxShadow: "0 0 60px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Close Deal</div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#F0F4FF", margin: 0 }}>
            {closingLead.name} · {closingLead.company}
          </h2>
        </div>
        <button onClick={() => setShowCloseModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>Outcome</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {([
          { value: "won",     label: "Won",     icon: <Trophy size={16} />,       color: "#00FF88", bg: "rgba(0,255,136,0.08)",  border: "rgba(0,255,136,0.3)"  },
          { value: "lost",    label: "Lost",    icon: <TrendingDown size={16} />, color: "#EF4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)"  },
          { value: "ghosted", label: "Ghosted", icon: <Ghost size={16} />,        color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.3)" },
        ] as const).map(opt => (
          <button key={opt.value} onClick={() => setCloseOutcome(opt.value)} style={{
            padding: "14px 8px", borderRadius: 12, cursor: "pointer",
            border: `1px solid ${closeOutcome === opt.value ? opt.border : "rgba(255,255,255,0.08)"}`,
            background: closeOutcome === opt.value ? opt.bg : "rgba(255,255,255,0.02)",
            color: closeOutcome === opt.value ? opt.color : "rgba(255,255,255,0.35)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s",
          }}>
            {opt.icon}{opt.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>
        Why? <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "rgba(255,255,255,0.2)" }}>(AI will auto-tag this)</span>
      </div>
      <textarea rows={3} value={closeReason} onChange={e => setCloseReason(e.target.value)}
        placeholder={
          closeOutcome === "won" ? "e.g. Strong ROI case, champion pushed it through..." :
          closeOutcome === "lost" ? "e.g. Price too high, went with competitor..." :
          "e.g. Stopped responding after the demo..."
        }
        style={{
          width: "100%", background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
          padding: "12px 14px", color: "#F0F4FF", fontSize: "0.83rem",
          resize: "none", outline: "none", lineHeight: 1.6, boxSizing: "border-box",
        }}
      />

      <button onClick={submitClose} disabled={closeLoading || !closeReason.trim()} style={{
        marginTop: 16, width: "100%", borderRadius: 12, padding: "13px",
        fontSize: "0.88rem", fontWeight: 600,
        cursor: closeLoading || !closeReason.trim() ? "not-allowed" : "pointer",
        border: "none", transition: "opacity 0.15s",
        opacity: closeLoading || !closeReason.trim() ? 0.4 : 1,
        background: closeOutcome === "won"
          ? "linear-gradient(135deg, #00FF88, #00D4FF)"
          : closeOutcome === "lost"
          ? "linear-gradient(135deg, #EF4444, #F59E0B)"
          : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
        color: "#000",
      }}>
        {closeLoading ? "Saving & tagging with AI..." : `Mark as ${closeOutcome.charAt(0).toUpperCase() + closeOutcome.slice(1)} →`}
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}