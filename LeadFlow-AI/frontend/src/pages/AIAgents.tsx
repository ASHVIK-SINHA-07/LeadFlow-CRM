import { Zap, Brain, Mail, TrendingDown } from 'lucide-react'

const agents = [
  {
    id: 1,
    name: 'Memory Agent',
    description: 'Reads all past conversation notes and surfaces what you promised each lead.',
    status: 'Active',
    color: '#5E6AD2',
    icon: Brain,
    stats: 'Tracking 3 leads • 6 open promises',
  },
  {
    id: 2,
    name: 'Warmth Decay Agent',
    description: 'Monitors lead scores and alerts you when a lead is going cold (3pts lost per day without contact).',
    status: 'Active',
    color: '#F59E0B',
    icon: TrendingDown,
    stats: '2 leads overdue today',
  },
  {
    id: 3,
    name: 'Follow-up Draft Agent',
    description: 'Writes personalized follow-up emails based on your last conversation and open promises.',
    status: 'Active',
    color: '#5E6AD2',
    icon: Mail,
    stats: '1-click drafts ready',
  },
  {
    id: 4,
    name: 'Transcript Analyzer',
    description: 'Extracts lead info, promises, and scores from raw sales conversation transcripts.',
    status: 'Active',
    color: '#22C55E',
    icon: Zap,
    stats: 'Upload a transcript to activate',
  },
]

export default function AIAgents() {
  return (
    <div style={{ padding: '40px 40px 60px 280px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8F91A2', marginBottom: 8 }}>Automation</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>AI Agents</h1>
          <p style={{ color: '#8F91A2', fontSize: '0.95rem', marginTop: 6 }}>Autonomous agents working in the background to keep your pipeline alive</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {agents.map(agent => {
            const Icon = agent.icon
            return (
              <div key={agent.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14, padding: 24,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: `${agent.color}16`,
                    border: `1px solid ${agent.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} style={{ color: agent.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC' }}>{agent.name}</span>
                      <span style={{
                        fontSize: '0.68rem', padding: '2px 8px', borderRadius: 99,
                        background: 'rgba(34,197,94,0.08)', color: '#22C55E',
                        fontWeight: 600,
                      }}>● {agent.status}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#C8CAD5', lineHeight: 1.6 }}>{agent.description}</p>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.775rem', color: agent.color,
                  background: `${agent.color}08`,
                  border: `1px solid ${agent.color}15`,
                  borderRadius: 6, padding: '8px 12px',
                  fontWeight: 500,
                }}>
                  ↳ {agent.stats}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}