import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Users, Plus, BarChart2, Zap,
  Upload, Brain, ArrowRight, Command, Sparkles,
  Loader, TrendingDown, BellRing, Archive,
} from 'lucide-react'
import { searchLeads } from '../services/api'

const COMMANDS = [
  { id: 'dashboard', icon: Command,   label: 'Go to Dashboard',    shortcut: 'D', to: '/'          },
  { id: 'leads',     icon: Users,     label: 'View All Leads',     shortcut: 'L', to: '/leads'     },
  { id: 'newlead',   icon: Plus,      label: 'Create New Lead',    shortcut: 'N', to: '/leads'     },
  { id: 'upload',    icon: Upload,    label: 'Import Leads',       shortcut: 'U', to: '/upload'    },
  { id: 'brief',     icon: Sparkles,  label: 'Morning Brief',      shortcut: 'B', to: '/brief'     },
  { id: 'alerts',    icon: BellRing,  label: 'Cold Alerts',        shortcut: 'A', to: '/alerts'    },
  { id: 'archive',   icon: Archive,   label: 'Deal Archive',       shortcut: 'V', to: '/archive'   },
  { id: 'analytics', icon: BarChart2, label: 'Open Analytics',     shortcut: 'R', to: '/analytics' },
  { id: 'agents',    icon: Zap,       label: 'AI Agents',          shortcut: 'G', to: '/agents'    },
  { id: 'predict',   icon: Brain,     label: 'Predict Conversion', shortcut: 'P', to: null         },
]

const HINTS = [
  'show leads going cold this week',
  'who did I promise a demo to?',
  'leads overdue more than 5 days',
  'hot leads',
  'who needs a follow up?',
  'cold leads',
]

function isNaturalLanguage(q: string): boolean {
  if (q.length < 3) return false
  const commandMatch = COMMANDS.some(c => c.label.toLowerCase().includes(q.toLowerCase()))
  if (commandMatch && q.length < 12) return false
  const nlSignals = ['who', 'show', 'find', 'leads', 'overdue', 'cold', 'hot', 'promised', 'promise', 'days', 'follow', 'going', 'week', 'need', 'warm', 'demo', 'contact', 'today']
  const lower = q.toLowerCase()
  return nlSignals.some(s => lower.includes(s)) || q.includes('?') || q.split(' ').length >= 3
}

type SearchResult = {
  id: number; name: string; company: string;
  warmthScore: number; daysSinceContact: number;
  overdueFollowUp: boolean; promises: string[];
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery]           = useState('')
  const [selected, setSelected]     = useState(0)
  const [mode, setMode]             = useState<'commands' | 'search'>('commands')
  const [searching, setSearching]   = useState(false)
  const [results, setResults]       = useState<SearchResult[]>([])
  const [explanation, setExplanation] = useState('')
  const [searchError, setSearchError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate  = useNavigate()
  const inputRef  = useRef<HTMLInputElement>(null)
  const filtered  = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (isNaturalLanguage(query)) {
      setMode('search')
      setSearchError('')
      debounceRef.current = setTimeout(() => runSearch(query), 600)
    } else {
      setMode('commands')
      setResults([])
      setExplanation('')
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const runSearch = async (q: string) => {
    setSearching(true); setResults([]); setExplanation('')
    try {
      const data = await searchLeads(q)
      setResults(data.results ?? [])
      setExplanation(data.explanation ?? '')
    } catch { setSearchError('Search failed — check backend connection.') }
    finally { setSearching(false) }
  }

  const executeCommand = (cmd: typeof COMMANDS[0]) => {
    if (cmd.to) navigate(cmd.to)
    onClose()
  }

  const openLead = () => { navigate('/leads'); onClose() }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (mode === 'commands') {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && filtered[selected]) executeCommand(filtered[selected])
    }
    if (mode === 'search' && e.key === 'Enter' && results.length > 0) openLead()
  }

  const scoreColor = (s: number) => s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="command-overlay" onClick={onClose}>
      <div className="command-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>

        {/* Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {mode === 'search'
            ? searching
              ? <Loader size={15} style={{ position: 'absolute', left: 24, color: '#5E6AD2', animation: 'spin 0.8s linear infinite' }} />
              : <Sparkles size={15} style={{ position: 'absolute', left: 24, color: '#5E6AD2' }} />
            : <Search size={15} style={{ position: 'absolute', left: 24, color: '#52525B' }} />
          }
          <input
            ref={inputRef}
            className="command-input"
            placeholder="Search commands or ask about your leads..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            style={{
              paddingLeft: 50,
              borderBottom: mode === 'search' ? '1px solid rgba(94,106,210,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}
          />
          <div style={{
            position: 'absolute', right: 16, padding: '2px 7px',
            background: mode === 'search' ? 'rgba(94,106,210,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${mode === 'search' ? 'rgba(94,106,210,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 5, fontSize: '0.65rem',
            color: mode === 'search' ? '#5E6AD2' : '#52525B',
          }}>
            {mode === 'search' ? 'AI' : 'ESC'}
          </div>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}>

          {/* Command mode */}
          {mode === 'commands' && (
            <>
              <div style={{ padding: '6px 20px 4px', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.07em', color: '#3F3F46', textTransform: 'uppercase' }}>Commands</div>
              {filtered.map((cmd, i) => (
                <div key={cmd.id} className={`cmd-item ${i === selected ? 'selected' : ''}`}
                  onClick={() => executeCommand(cmd)} onMouseEnter={() => setSelected(i)}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: i === selected ? 'rgba(94,106,210,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${i === selected ? 'rgba(94,106,210,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <cmd.icon size={13} style={{ color: i === selected ? '#5E6AD2' : '#71717A' }} />
                  </div>
                  <span style={{ flex: 1 }}>{cmd.label}</span>
                  <div style={{ padding: '1px 7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, fontSize: '0.62rem', color: '#52525B' }}>
                    {cmd.shortcut}
                  </div>
                  {i === selected && <ArrowRight size={12} style={{ color: '#5E6AD2' }} />}
                </div>
              ))}

              {/* Hint chips */}
              {query.length === 0 && (
                <div style={{ padding: '14px 24px 6px' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.07em', color: '#3F3F46', textTransform: 'uppercase', marginBottom: 8 }}>Try asking</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {HINTS.map(hint => (
                      <button key={hint} onClick={() => setQuery(hint)} style={{
                        fontSize: '0.72rem', padding: '4px 10px', borderRadius: 6,
                        background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.15)',
                        color: '#5E6AD2', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>
                        <Sparkles size={9} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Search mode */}
          {mode === 'search' && (
            <>
              {explanation && !searching && (
                <div style={{ margin: '8px 16px 4px', padding: '10px 14px', borderRadius: 8, background: 'rgba(94,106,210,0.07)', border: '1px solid rgba(94,106,210,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={13} color='#5E6AD2' />
                  <span style={{ fontSize: '0.775rem', color: '#A1A1AA' }}>{explanation}</span>
                </div>
              )}

              {searching && (
                <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>AI is searching your pipeline...</p>
                </div>
              )}

              {searchError && !searching && (
                <div style={{ padding: '12px 24px' }}>
                  <p style={{ fontSize: '0.78rem', color: '#EF4444', margin: 0 }}>{searchError}</p>
                </div>
              )}

              {!searching && !searchError && results.length === 0 && explanation && (
                <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.2)', margin: 0 }}>No leads match this query.</p>
                </div>
              )}

              {!searching && results.length > 0 && (
                <>
                  <div style={{ padding: '8px 24px 4px', fontSize: '0.62rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                    {results.length} lead{results.length > 1 ? 's' : ''} found
                  </div>
                  {results.map(lead => (
                    <div key={lead.id} className="cmd-item" onClick={openLead} style={{ alignItems: 'flex-start', padding: '12px 24px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: '0.8375rem', fontWeight: 500, color: '#F4F4F5' }}>{lead.name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#52525B' }}>{lead.company}</span>
                          {lead.overdueFollowUp && (
                            <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 500 }}>
                              Overdue {lead.daysSinceContact}d
                            </span>
                          )}
                        </div>
                        {lead.promises.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {lead.promises.slice(0, 2).map((p, i) => (
                              <span key={i} style={{ fontSize: '0.66rem', padding: '1px 7px', borderRadius: 5, background: 'rgba(94,106,210,0.08)', color: '#5E6AD2' }}>· {p}</span>
                            ))}
                            {lead.promises.length > 2 && <span style={{ fontSize: '0.66rem', color: '#52525B' }}>+{lead.promises.length - 2}</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', color: scoreColor(lead.warmthScore) }}>{lead.warmthScore}</div>
                        <div style={{ fontSize: '0.58rem', color: '#52525B', textTransform: 'uppercase' }}>warmth</div>
                      </div>
                      <TrendingDown size={13} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0, alignSelf: 'center' }} />
                    </div>
                  ))}
                  <div style={{ padding: '8px 14px 4px' }}>
                    <button onClick={openLead} style={{
                      width: '100%', padding: '9px', borderRadius: 8,
                      background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.2)',
                      color: '#5E6AD2', fontSize: '0.775rem', fontWeight: 500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      <ArrowRight size={13} /> Open Leads
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '9px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.65rem', color: '#3F3F46' }}>
            <span>↑↓ Navigate</span><span>↵ Select</span><span>Esc Close</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: mode === 'search' ? '#5E6AD2' : '#3F3F46' }}>
            {mode === 'search' ? 'AI search active' : 'Ask a question to search'}
          </div>
        </div>
      </div>
    </div>
  )
}