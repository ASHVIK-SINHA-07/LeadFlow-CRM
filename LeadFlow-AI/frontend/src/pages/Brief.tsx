import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Phone, AlertTriangle, Clock, RefreshCw, ChevronRight, Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import type { BriefLead } from '../hooks/useBrief'
import { useBrief } from '../hooks/useBrief'
import { getLeads, getPreCallBrief } from '../services/api'

// ── Shared style helpers ──────────────────────────────────────────────────
const surface: React.CSSProperties = {
  background: '#111113',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 600,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: '#52525B', marginBottom: 14,
}

const btnGhost: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '7px 13px', borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'transparent',
  color: '#A1A1AA', fontSize: '0.775rem',
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}

const scoreColor = (s: number) => s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444'

// ─────────────────────────────────────────────────────────────────────────
export default function Brief() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<any[]>([])
  const [leadsLoaded, setLeadsLoaded] = useState(false)

  // ── Query-param: ?lead=<id> ──────────────────────────────────────────────
  const params = new URLSearchParams(window.location.search)
  const preselectedId = params.get('lead')

  type PreCallBrief = {
    leadName: string; company: string; warmthScore: number; daysSince: number
    lastDiscussed: string; openPromises: string[]; objections: string[]
    suggestedOpener: string; mainObjective: string; warmthTrend: string
    talkingPoints: string[]; risksToAvoid: string[]
  }

  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [perLeadBrief, setPerLeadBrief] = useState<PreCallBrief | null>(null)
  const [perLeadLoading, setPerLeadLoading] = useState(false)
  const [perLeadError, setPerLeadError] = useState<string | null>(null)

  const fetchPerLeadBrief = async (lead: any) => {
    setSelectedLead(lead)
    setPerLeadBrief(null)
    setPerLeadError(null)
    setPerLeadLoading(true)
    try {
      const result = await getPreCallBrief(lead.id)
      setPerLeadBrief(result)
    } catch (e: any) {
      setPerLeadError(e?.message ?? 'Failed to load brief')
    } finally {
      setPerLeadLoading(false)
    }
  }

  useEffect(() => {
    getLeads().then(data => {
      setLeads(data)
      setLeadsLoaded(true)
      if (preselectedId) {
        const match = data.find((l: any) => String(l.id) === preselectedId)
        if (match) fetchPerLeadBrief(match)
      }
    })
  }, [])

  const { brief, loading, error, refresh } = useBrief(leadsLoaded ? leads : [])

  const now = new Date()
  const greeting =
    now.getHours() < 12 ? 'Good morning' :
    now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  const totalItems = brief
    ? brief.topCalls.length + brief.promisesDue.length + brief.atRisk.length
    : 0

  return (
    <div style={{ padding: '40px 40px 60px 280px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8F91A2', marginBottom: 8 }}>
            {selectedLead ? 'Pre-Call Brief' : 'Morning Brief'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: 6 }}>
                {selectedLead ? selectedLead.name : `${greeting}.`}
              </h1>
              <p style={{ color: '#8F91A2', fontSize: '0.95rem' }}>
                {selectedLead
                  ? `${selectedLead.company} · Warmth ${selectedLead.warmthScore} · ${selectedLead.daysSinceContact}d since last contact`
                  : "Here's what needs your attention today."}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {selectedLead && (
                <button
                  onClick={() => { setSelectedLead(null); setPerLeadBrief(null); window.history.replaceState({}, '', '/brief') }}
                  style={btnGhost}
                >
                  <ArrowLeft size={13} /> Daily Brief
                </button>
              )}
              {!selectedLead && (
                <button
                  onClick={() => { localStorage.removeItem('leadflow_brief_cache'); refresh() }}
                  disabled={loading}
                  style={{ ...btnGhost, opacity: loading ? 0.5 : 1 }}
                >
                  <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </button>
              )}
            </div>
          </div>
          {brief && !selectedLead && (
            <p style={{ fontSize: '0.75rem', color: '#8F91A2', marginTop: 8 }}>
              Generated at {new Date(brief.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {error && <span style={{ color: '#EF4444', marginLeft: 10 }}>· {error}</span>}
            </p>
          )}
        </div>

      {/* ── PER-LEAD BRIEF VIEW ── */}
      {selectedLead && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Loading skeletons */}
          {perLeadLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[120, 100, 140].map((h, i) => (
                <div key={i} style={{ height: h, borderRadius: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease infinite' }} />
              ))}
              <p style={{ textAlign: 'center', color: '#52525B', fontSize: '0.8rem', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Sparkles size={13} style={{ color: '#5E6AD2' }} /> Preparing your pre-call brief…
              </p>
            </div>
          )}

          {perLeadError && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#EF4444', fontSize: '0.8125rem' }}>
              {perLeadError}
            </div>
          )}

          {perLeadBrief && !perLeadLoading && (() => {
            const b = perLeadBrief
            return (
              <>
                {/* ── SECTION 1: PRIORITY INTEL ── */}
                <div style={{ ...surface, padding: '20px 22px' }}>
                  <div style={sectionLabel}>Priority Intel</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px 24px', alignItems: 'start' }}>
                    {/* Warmth number */}
                    <div style={{ textAlign: 'center', minWidth: 72 }}>
                      <div style={{
                        fontSize: '2.5rem', fontWeight: 700,
                        fontFamily: 'Space Grotesk, sans-serif',
                        color: scoreColor(b.warmthScore),
                        lineHeight: 1, letterSpacing: '-0.03em',
                      }}>{b.warmthScore}</div>
                      <div style={{ fontSize: '0.6rem', color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>warmth</div>
                      <div style={{
                        marginTop: 6, fontSize: '0.62rem', fontWeight: 500,
                        padding: '2px 8px', borderRadius: 99, display: 'inline-block',
                        background: b.warmthTrend === 'stable' ? 'rgba(34,197,94,0.08)' : b.warmthTrend === 'declining' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                        color: b.warmthTrend === 'stable' ? '#22C55E' : b.warmthTrend === 'declining' ? '#F59E0B' : '#EF4444',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{b.warmthTrend}</div>
                    </div>

                    {/* Meta */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#F4F4F5', letterSpacing: '-0.01em' }}>{b.leadName}</span>
                        <span style={{ fontSize: '0.8125rem', color: '#71717A' }}>{b.company}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                        <Clock size={11} style={{ color: '#52525B' }} />
                        <span style={{ fontSize: '0.775rem', color: '#71717A' }}>
                          {b.daysSince === 0 ? 'Contacted today' : `${b.daysSince} day${b.daysSince !== 1 ? 's' : ''} ago`}
                        </span>
                      </div>
                      {/* Main Objective */}
                      <div style={{ padding: '10px 14px', background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.15)', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#5E6AD2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Main Objective</div>
                        <p style={{ fontSize: '0.8375rem', color: '#F4F4F5', lineHeight: 1.55, margin: 0 }}>{b.mainObjective}</p>
                      </div>
                      {b.lastDiscussed && (
                        <p style={{ fontSize: '0.775rem', color: '#71717A', marginTop: 10, lineHeight: 1.5 }}>
                          <span style={{ color: '#52525B' }}>Last discussed:</span> {b.lastDiscussed}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: OPEN PROMISES ── */}
                <div style={{ ...surface, padding: '20px 22px' }}>
                  <div style={sectionLabel}>Open Promises</div>
                  {b.openPromises.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8 }}>
                      <CheckCircle size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8125rem', color: '#71717A' }}>No open promises — you're clear.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {b.openPromises.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 8 }}>
                          {/* Visual checkbox */}
                          <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1, border: '1.5px solid rgba(245,158,11,0.4)' }} />
                          <span style={{ fontSize: '0.8125rem', color: '#D4D4D8', lineHeight: 1.5 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── SECTION 3: SUGGESTED OPENER + TALKING POINTS ── */}
                <div style={{ ...surface, padding: '20px 22px' }}>
                  <div style={sectionLabel}>Suggested Opener + Talking Points</div>

                  {/* Quote */}
                  <div style={{ borderLeft: '2px solid #5E6AD2', background: 'rgba(94,106,210,0.05)', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#5E6AD2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Open with</div>
                    <p style={{ fontSize: '0.875rem', color: '#F4F4F5', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{b.suggestedOpener}"</p>
                  </div>

                  {/* Talking points */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {b.talkingPoints.map((tp, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 600, color: '#71717A',
                        }}>{i + 1}</div>
                        <span style={{ fontSize: '0.8375rem', color: '#A1A1AA', lineHeight: 1.55, paddingTop: 2 }}>{tp}</span>
                      </div>
                    ))}
                  </div>

                  {/* Risks */}
                  {b.risksToAvoid?.length > 0 && (
                    <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Avoid</div>
                      {b.risksToAvoid.map((r, i) => (
                        <p key={i} style={{ fontSize: '0.8rem', color: '#71717A', margin: '3px 0' }}>· {r}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => navigate('/leads')}
                    style={{ ...btnGhost }}
                  >
                    Open lead <ChevronRight size={12} />
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ── DAILY BRIEF VIEW ── */}
      {!selectedLead && (
        <>
          {/* Loading */}
          {(loading || !leadsLoaded) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[100, 80, 80].map((h, i) => (
                <div key={i} style={{ height: h, borderRadius: 10, background: '#111113', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease infinite' }} />
              ))}
              <p style={{ textAlign: 'center', color: '#52525B', fontSize: '0.8rem', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Sparkles size={13} style={{ color: '#5E6AD2' }} /> Reading your pipeline…
              </p>
            </div>
          )}

          {brief && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <BriefSection
                icon={<Phone size={14} style={{ color: '#5E6AD2' }} />}
                label="Who to call today"
                count={brief.topCalls.length}
                empty={brief.topCalls.length === 0}
                emptyMsg="No urgent calls — pipeline looks healthy."
              >
                {brief.topCalls.map(lead => (
                  <LeadRow
                    key={lead.id} lead={lead}
                    meta={lead.reason ?? 'Priority contact today'}
                    badge={`${lead.warmth} warmth`}
                    badgeColor={lead.warmth > 60 ? '#22C55E' : lead.warmth > 30 ? '#F59E0B' : '#EF4444'}
                    action="Follow up"
                    onAction={() => navigate('/leads')}
                  />
                ))}
              </BriefSection>

              <BriefSection
                icon={<Clock size={14} style={{ color: '#F59E0B' }} />}
                label="Promises to keep"
                count={brief.promisesDue.length}
                empty={brief.promisesDue.length === 0}
                emptyMsg="All promises on track."
              >
                {brief.promisesDue.map(lead => (
                  <LeadRow
                    key={lead.id} lead={lead}
                    meta={lead.promise ? `"${lead.promise}"` : 'Open promise'}
                    badge={lead.daysOverdue && lead.daysOverdue > 0 ? `${lead.daysOverdue}d overdue` : 'Due today'}
                    badgeColor={lead.daysOverdue && lead.daysOverdue > 3 ? '#EF4444' : '#F59E0B'}
                    action="Send now"
                    onAction={() => navigate('/leads')}
                  />
                ))}
              </BriefSection>

              <BriefSection
                icon={<AlertTriangle size={14} style={{ color: '#EF4444' }} />}
                label="Going cold"
                count={brief.atRisk.length}
                empty={brief.atRisk.length === 0}
                emptyMsg="No leads going cold."
              >
                {brief.atRisk.map(lead => (
                  <LeadRow
                    key={lead.id} lead={lead}
                    meta={`Last contact: ${lead.lastContact ?? 'unknown'}`}
                    badge={`${lead.warmth} warmth`}
                    badgeColor="#EF4444"
                    action="Re-engage"
                    onAction={() => navigate('/leads')}
                  />
                ))}
              </BriefSection>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {totalItems === 0
                    ? <><CheckCircle size={13} style={{ color: '#22C55E' }} /><span style={{ fontSize: '0.8125rem', color: '#71717A' }}>Nothing urgent — pipeline healthy.</span></>
                    : <span style={{ fontSize: '0.8125rem', color: '#71717A' }}>{totalItems} item{totalItems !== 1 ? 's' : ''} need your attention today</span>
                  }
                </div>
                <button onClick={() => navigate('/leads')} style={{ ...btnGhost, border: 'none', padding: '0' }}>
                  Open leads <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}

/* ─── BriefSection ──────────────────────────────────────────────────────── */
function BriefSection({ icon, label, count, children, empty, emptyMsg }: {
  icon: React.ReactNode; label: string; count: number
  children: React.ReactNode; empty: boolean; emptyMsg: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: '0.775rem', fontWeight: 500, color: '#A1A1AA' }}>{label}</span>
        {count > 0 && (
          <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', borderRadius: 99, padding: '1px 7px', color: '#71717A' }}>
            {count}
          </span>
        )}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
        {empty
          ? <p style={{ padding: '14px 18px', fontSize: '0.8125rem', color: '#52525B' }}>{emptyMsg}</p>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        }
      </div>
    </div>
  )
}

/* ─── LeadRow ───────────────────────────────────────────────────────────── */
function LeadRow({ lead, meta, badge, badgeColor, action, onAction }: {
  lead: BriefLead; meta: string; badge: string
  badgeColor: string; action: string; onAction: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
        padding: '12px 18px',
        background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.12s', cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ fontSize: '0.8375rem', fontWeight: 500, color: '#F4F4F5' }}>{lead.name}</span>
          <span style={{ fontSize: '0.75rem', color: '#52525B' }}>{lead.company}</span>
        </div>
        <p style={{ fontSize: '0.775rem', color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{
          fontSize: '0.68rem', fontWeight: 500, padding: '2px 8px', borderRadius: 99,
          background: `${badgeColor}15`, color: badgeColor,
        }}>{badge}</span>

        <button
          onClick={e => { e.stopPropagation(); onAction() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            color: '#A1A1AA',
            fontSize: '0.72rem', cursor: 'pointer',
            transition: 'opacity 0.12s',
            opacity: hovered ? 1 : 0,
          }}
        >
          <Mail size={10} /> {action}
        </button>
      </div>
    </div>
  )
}