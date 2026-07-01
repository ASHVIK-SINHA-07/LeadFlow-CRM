import { useEffect, useState } from 'react'
import { getDashboard, getLeads, getArchive, getArchiveStats } from '../services/api'

export default function Analytics() {
  const [stats, setStats]               = useState<any>(null)
  const [leads, setLeads]               = useState<any[]>([])
  const [archive, setArchive]           = useState<any[]>([])
  const [archiveStats, setArchiveStats] = useState<any>(null)
  const [tab, setTab]                   = useState<'pipeline' | 'winloss'>('pipeline')

  useEffect(() => {
    getDashboard().then(setStats)
    getLeads().then(setLeads)
    getArchive().then(setArchive)
    getArchiveStats().then(setArchiveStats)
  }, [])

  const scoreColor = (s: number) => s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444'
  const outcomeColor = (o: string) => o === 'won' ? '#22C55E' : o === 'lost' ? '#EF4444' : '#8B5CF6'
  const outcomeLabel = (o: string) => o === 'won' ? '🏆 Won' : o === 'lost' ? '📉 Lost' : '👻 Ghosted'

  return (
    <div style={{ padding: '40px 40px 60px 280px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8F91A2', marginBottom: 8 }}>Insights</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Analytics</h1>
          <p style={{ color: '#8F91A2', fontSize: '0.95rem', marginTop: 6 }}>Pipeline health and deal performance</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {(['pipeline', 'winloss'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: tab === t ? 'var(--accent-bg)' : 'rgba(255,255,255,0.03)',
              color: tab === t ? 'var(--accent)' : '#C8CAD5',
              outline: tab === t ? '1px solid var(--accent)' : '1px solid var(--border)',
            }}>
              {t === 'pipeline' ? '📊 Pipeline' : '🏆 Win / Loss'}
            </button>
          ))}
        </div>

        {/* Pipeline tab */}
        {tab === 'pipeline' && (
          <>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'Pipeline Health', value: `${Math.round((stats.hot / Math.max(stats.total, 1)) * 100)}%`, color: '#22C55E', sub: `${stats.hot} hot leads` },
                  { label: 'At Risk',         value: stats.cold,          color: '#EF4444', sub: 'cold leads' },
                  { label: 'Open Promises',   value: stats.totalPromises, color: '#F59E0B', sub: 'commitments to keep' },
                ].map(c => (
                  <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: c.color, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 6 }}>{c.value}</div>
                    <div style={{ fontSize: '0.9rem', color: '#F8FAFC', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8F91A2' }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', color: '#8F91A2', textTransform: 'uppercase', marginBottom: 20 }}>Warmth Score Breakdown</div>
              {leads.map((lead: any) => (
                <div key={lead.id} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.9rem', color: '#C8CAD5' }}>
                      {lead.name} <span style={{ color: '#8F91A2', fontSize: '0.8rem' }}>{lead.company}</span>
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: scoreColor(lead.warmthScore) }}>{lead.warmthScore}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${lead.warmthScore}%`, background: `linear-gradient(90deg, ${scoreColor(lead.warmthScore)}, ${scoreColor(lead.warmthScore)}88)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8F91A2', marginTop: 6 }}>
                    Last contact {lead.daysSinceContact}d ago • {lead.overdueFollowUp ? '⚠️ Overdue' : '✓ On track'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Win/Loss tab */}
        {tab === 'winloss' && (
          <>
            {archiveStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'Win Rate', value: `${archiveStats.winRate}%`, color: '#22C55E' },
                  { label: 'Won',      value: archiveStats.won,           color: '#22C55E' },
                  { label: 'Lost',     value: archiveStats.lost,          color: '#EF4444' },
                  { label: 'Ghosted',  value: archiveStats.ghosted,       color: '#8B5CF6' },
                ].map(c => (
                  <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: c.color, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>{c.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8F91A2', fontWeight: 550 }}>{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {archiveStats?.topTags?.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', color: '#8F91A2', textTransform: 'uppercase', marginBottom: 6 }}>🤖 AI-detected patterns</div>
                <p style={{ fontSize: '0.85rem', color: '#8F91A2', marginBottom: 20, marginTop: 4 }}>Auto-tagged from your close reasons</p>
                {archiveStats.topTags.map((t: any) => (
                  <div key={t.tag} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: '#F8FAFC', textTransform: 'capitalize' }}>{t.tag}</span>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem' }}>
                        {t.won     > 0 && <span style={{ color: '#22C55E' }}>+{t.won} won</span>}
                        {t.lost    > 0 && <span style={{ color: '#EF4444' }}>−{t.lost} lost</span>}
                        {t.ghosted > 0 && <span style={{ color: '#8B5CF6' }}>?{t.ghosted} ghosted</span>}
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${(t.won / t.total) * 100}%`, background: '#22C55E' }} />
                      <div style={{ width: `${(t.lost / t.total) * 100}%`, background: '#EF4444' }} />
                      <div style={{ width: `${(t.ghosted / t.total) * 100}%`, background: '#8B5CF6' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', color: '#8F91A2', textTransform: 'uppercase', marginBottom: 20 }}>
                Deal Archive ({archive.length})
              </div>
              {archive.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: '#8F91A2', textAlign: 'center', padding: '32px 0' }}>
                  No closed deals yet. Hit "Close" on any lead to start tracking.
                </p>
              ) : archive.map((deal: any) => (
                <div key={deal.id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>{deal.name}</span>
                      <span style={{ fontSize: '0.8rem', color: '#8F91A2' }}>{deal.company}</span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: `${outcomeColor(deal.outcome)}15`, color: outcomeColor(deal.outcome), border: `1px solid ${outcomeColor(deal.outcome)}33` }}>
                        {outcomeLabel(deal.outcome)}
                      </span>
                    </div>
                    {deal.closeReason && (
                      <p style={{ fontSize: '0.82rem', color: '#C8CAD5', margin: '0 0 8px', fontStyle: 'italic' }}>"{deal.closeReason}"</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(deal.closeTags ?? []).map((tag: string) => (
                        <span key={tag} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: '#8F91A2', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8F91A2', flexShrink: 0 }}>
                    {new Date(deal.closedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}