import { useState, useEffect } from 'react'
import {
  User, Bell, Flame, Bot, Link2, Database, Command,
  Eye, EyeOff, Download, Trash2, Mail, Calendar, KeyRound, Brain, TrendingDown, Zap, ShieldAlert, X
} from 'lucide-react'
import { getLeads, getBackendSettings, saveBackendSettings } from '../services/api'

export default function Settings() {
  // Profile state
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('lf_settings_profile')
    return saved ? JSON.parse(saved) : { name: 'Priya Menon', email: 'priya@flipkart.com', workspace: 'LeadFlow' }
  })

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('lf_settings_notifications')
    return saved ? JSON.parse(saved) : { coldAlerts: true, overdueReminders: true, morningBrief: true }
  })

  // Lead scoring state
  const [scoring, setScoring] = useState(() => {
    const saved = localStorage.getItem('lf_settings_scoring')
    return saved ? JSON.parse(saved) : { decayRate: 3, thresholdHot: 70, thresholdWarm: 40 }
  })

  // AI Agents state
  const [agentsState, setAgentsState] = useState(() => {
    const saved = localStorage.getItem('lf_settings_agents')
    return saved ? JSON.parse(saved) : { memoryAgent: true, warmthDecay: true, followUpDraft: true, transcriptAnalyzer: false }
  })

  // Integrations state
  const [integrations, setIntegrations] = useState(() => {
    const saved = localStorage.getItem('lf_settings_integrations')
    return saved ? JSON.parse(saved) : { emailConnected: false, calendarConnected: false, apiKey: 'sk-groq-7f8a9b1c2d3e4f5a6b7c8d9e0f' }
  })

  // UI state
  const [showApiKey, setShowApiKey] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [clearingArchive, setClearingArchive] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Fetch settings from backend on mount
  useEffect(() => {
    getBackendSettings()
      .then(data => {
        if (data) {
          setScoring({
            decayRate: data.decayRate ?? 3,
            thresholdHot: data.thresholdHot ?? 70,
            thresholdWarm: data.thresholdWarm ?? 40,
          })
        }
      })
      .catch(console.error)
  }, [])

  // Persist states on change
  useEffect(() => {
    localStorage.setItem('lf_settings_profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem('lf_settings_notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    saveBackendSettings(scoring).catch(console.error)
    localStorage.setItem('lf_settings_scoring', JSON.stringify(scoring))
  }, [scoring])

  useEffect(() => {
    localStorage.setItem('lf_settings_agents', JSON.stringify(agentsState))
  }, [agentsState])

  useEffect(() => {
    localStorage.setItem('lf_settings_integrations', JSON.stringify(integrations))
  }, [integrations])

  const getInitials = (n: string) => {
    return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  }

  // Functional CSV Export
  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const leads = await getLeads()
      const headers = ['ID', 'Name', 'Company', 'Warmth Score', 'Status', 'Days Since Contact', 'Overdue Follow Up', 'Promises Count']
      const rows = leads.map((l: any) => [
        l.id,
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.company.replace(/"/g, '""')}"`,
        l.warmthScore,
        l.status,
        l.daysSinceContact,
        l.overdueFollowUp ? 'TRUE' : 'FALSE',
        Array.isArray(l.promises) ? l.promises.length : 0
      ])
      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `leadflow_leads_export_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Simulate brief delay
      setTimeout(() => setExporting(false), 800)
    } catch (e) {
      console.error(e)
      setExporting(false)
    }
  }

  const handleClearArchive = () => {
    setClearingArchive(true)
    // Simulate API call
    setTimeout(() => {
      setClearingArchive(false)
      alert('Archive cleared successfully!')
    }, 1500)
  }

  const handleDeleteWorkspace = () => {
    if (deleteConfirmText.toLowerCase() === 'delete') {
      setDeleting(true)
      setTimeout(() => {
        setDeleting(false)
        setShowDeleteModal(false)
        setDeleteConfirmText('')
        alert('Workspace deleted. Resetting application...')
        localStorage.clear()
        window.location.href = '/'
      }, 1500)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#F8FAFC',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s',
  }

  const btnSecondary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px', borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
    color: '#C8CAD5', fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  }

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      style={{
        width: 42, height: 22, borderRadius: 99,
        background: checked ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  )

  const agentsList = [
    { key: 'memoryAgent', name: 'Memory Agent', desc: 'Reads all past conversation notes and surfaces what you promised each lead.', icon: Brain, color: '#5E6AD2' },
    { key: 'warmthDecay', name: 'Warmth Decay Agent', desc: 'Monitors lead scores and alerts you when a lead is going cold.', icon: TrendingDown, color: '#F59E0B' },
    { key: 'followUpDraft', name: 'Follow-up Draft Agent', desc: 'Writes personalized follow-up emails based on your last conversation.', icon: Mail, color: '#5E6AD2' },
    { key: 'transcriptAnalyzer', name: 'Transcript Analyzer', desc: 'Extracts lead info, promises, and scores from raw sales conversation transcripts.', icon: Zap, color: '#22C55E' },
  ]

  return (
    <div style={{ padding: '40px 40px 60px 280px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8F91A2', marginBottom: 8 }}>Preferences</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Settings</h1>
          <p style={{ color: '#8F91A2', fontSize: '0.95rem', marginTop: 6 }}>Manage your profile, workspaces, AI scoring, and integrations</p>
        </div>

        {/* 1. Profile Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <User size={16} style={{ color: '#8F91A2' }} />
            <span className="label">PROFILE</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 20 }}>Personal Profile</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--accent-bg)', border: '1px solid rgba(94, 106, 210, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)'
            }}>
              {getInitials(profile.name)}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC' }}>{profile.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#8F91A2', marginTop: 2 }}>Workspace: {profile.workspace}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#8F91A2', display: 'block', marginBottom: 6 }}>Display Name</label>
              <input
                style={inputStyle}
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#8F91A2', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input
                style={inputStyle}
                type="email"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 2. Notifications Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Bell size={16} style={{ color: '#8F91A2' }} />
            <span className="label">NOTIFICATIONS</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 20 }}>Notification Preferences</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'coldAlerts' as const, label: 'Cold Lead Alerts', desc: 'Notify me when warmth score of an active lead drops below the threshold.' },
              { key: 'overdueReminders' as const, label: 'Overdue Follow-up Reminders', desc: 'Remind me of leads requiring daily follow-ups.' },
              { key: 'morningBrief' as const, label: 'Daily Morning Brief', desc: 'Deliver an in-app and email summary of my agenda each morning.' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ paddingRight: 16 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', color: '#8F91A2', marginTop: 2 }}>{item.desc}</div>
                </div>
                <ToggleSwitch
                  checked={notifications[item.key]}
                  onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Lead Scoring Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Flame size={16} style={{ color: '#8F91A2' }} />
            <span className="label">LEAD SCORING</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 20 }}>AI Score Configuration</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: '0.85rem', color: '#C8CAD5', fontWeight: 550 }}>Warmth Decay Rate</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>{scoring.decayRate} pts / day</span>
              </div>
              <input
                style={inputStyle}
                type="number"
                min="1"
                max="10"
                value={scoring.decayRate}
                onChange={e => setScoring({ ...scoring, decayRate: Number(e.target.value) })}
              />
              <span style={{ fontSize: '0.75rem', color: '#8F91A2', display: 'block', marginTop: 4 }}>Decreases score of active leads daily when there is no contact.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.85rem', color: '#C8CAD5', fontWeight: 550 }}>Hot Lead Threshold</label>
                  <span style={{ fontSize: '0.85rem', color: '#22C55E', fontWeight: 700 }}>&gt;= {scoring.thresholdHot}</span>
                </div>
                <input
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                  type="range"
                  min="50"
                  max="95"
                  value={scoring.thresholdHot}
                  onChange={e => setScoring({ ...scoring, thresholdHot: Number(e.target.value) })}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.85rem', color: '#C8CAD5', fontWeight: 550 }}>Cold Lead Threshold</label>
                  <span style={{ fontSize: '0.85rem', color: '#EF4444', fontWeight: 700 }}>&lt; {scoring.thresholdWarm}</span>
                </div>
                <input
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                  type="range"
                  min="15"
                  max="45"
                  value={scoring.thresholdWarm}
                  onChange={e => setScoring({ ...scoring, thresholdWarm: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. AI Agents Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Bot size={16} style={{ color: '#8F91A2' }} />
            <span className="label">AI AGENTS</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 20 }}>Automated Agent Toggles</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {agentsList.map(agent => {
              const AgentIcon = agent.icon
              const isChecked = agentsState[agent.key as keyof typeof agentsState]
              return (
                <div key={agent.key} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${agent.color}16`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: agent.color,
                    flexShrink: 0,
                  }}>
                    <AgentIcon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>{agent.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#8F91A2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {agent.desc}
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={isChecked}
                    onChange={() => setAgentsState({ ...agentsState, [agent.key]: !isChecked })}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 5. Integrations Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link2 size={16} style={{ color: '#8F91A2' }} />
            <span className="label">INTEGRATIONS</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 20 }}>Connected Applications</h2>

          {/* Email / Calendar Connections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail size={18} style={{ color: '#5E6AD2' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>Email Inbox</div>
                  <div style={{ fontSize: '0.75rem', color: integrations.emailConnected ? '#22C55E' : '#8F91A2', marginTop: 1 }}>
                    {integrations.emailConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIntegrations({ ...integrations, emailConnected: !integrations.emailConnected })}
                style={{
                  ...btnSecondary,
                  background: integrations.emailConnected ? 'rgba(239,68,68,0.08)' : 'var(--accent)',
                  color: integrations.emailConnected ? '#EF4444' : '#fff',
                  border: integrations.emailConnected ? '1px solid rgba(239,68,68,0.2)' : 'none',
                }}
              >
                {integrations.emailConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            <div style={{ padding: '16px 20px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Calendar size={18} style={{ color: '#F59E0B' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>Google Calendar</div>
                  <div style={{ fontSize: '0.75rem', color: integrations.calendarConnected ? '#22C55E' : '#8F91A2', marginTop: 1 }}>
                    {integrations.calendarConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIntegrations({ ...integrations, calendarConnected: !integrations.calendarConnected })}
                style={{
                  ...btnSecondary,
                  background: integrations.calendarConnected ? 'rgba(239,68,68,0.08)' : 'var(--accent)',
                  color: integrations.calendarConnected ? '#EF4444' : '#fff',
                  border: integrations.calendarConnected ? '1px solid rgba(239,68,68,0.2)' : 'none',
                }}
              >
                {integrations.calendarConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>

          {/* LLM Provider API Key */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <KeyRound size={14} style={{ color: '#8F91A2' }} />
              <label style={{ fontSize: '0.85rem', color: '#C8CAD5', fontWeight: 550 }}>LLM Provider API Key (Gemini/Groq)</label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 40 }}
                value={integrations.apiKey}
                onChange={e => setIntegrations({ ...integrations, apiKey: e.target.value })}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#8F91A2', cursor: 'pointer'
                }}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* 6. Data Management & Danger Zone */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Database size={16} style={{ color: '#8F91A2' }} />
            <span className="label">DATA MANAGEMENT</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 20 }}>System Actions</h2>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              style={{ ...btnSecondary, background: 'var(--accent)', border: 'none', color: '#fff' }}
            >
              <Download size={15} />
              {exporting ? 'Exporting...' : 'Export Leads to CSV'}
            </button>
            <button
              onClick={handleClearArchive}
              disabled={clearingArchive}
              style={btnSecondary}
            >
              <Trash2 size={15} />
              {clearingArchive ? 'Clearing...' : 'Clear Deal Archive'}
            </button>
          </div>

          {/* Danger Zone Card */}
          <div style={{
            padding: 20,
            background: 'rgba(239,68,68,0.03)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldAlert size={16} style={{ color: '#EF4444' }} />
              <span style={{ fontSize: '0.725rem', fontWeight: 600, letterSpacing: '0.12em', color: '#EF4444' }}>DANGER ZONE</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Delete Workspace</h3>
            <p style={{ fontSize: '0.85rem', color: '#C8CAD5', lineHeight: 1.6, marginBottom: 16 }}>
              Deleting this workspace permanently removes all active leads, deals history, notes, and resets configurations. This action is irreversible.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8,
                border: 'none', background: '#EF4444',
                color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.15s',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
              }}
            >
              Delete Workspace
            </button>
          </div>
        </div>

        {/* 7. Command Palette Card */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Command size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>Command Palette Shortcut</div>
              <div style={{ fontSize: '0.85rem', color: '#8F91A2', marginTop: 2 }}>Access quick actions and navigation globally</div>
            </div>
          </div>
          <kbd style={{
            fontSize: '0.8rem', color: '#8F91A2',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '4px 10px',
            fontWeight: 700,
          }}>⌘K</kbd>
        </div>

      </div>

      {/* Delete Workspace Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          backdropFilter: "blur(4px)",
          animation: "fade-in 0.15s ease",
        }}>
          <div style={{
            background: "var(--surface)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 14, padding: 28, width: 440, position: "relative",
            animation: "slide-up 0.15s ease",
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          }}>
            <button onClick={() => setShowDeleteModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#8F91A2", cursor: "pointer" }}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldAlert size={18} style={{ color: '#EF4444' }} />
              <span style={{ fontSize: '0.725rem', fontWeight: 600, letterSpacing: '0.12em', color: '#EF4444' }}>CONFIRM DELETION</span>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#F8FAFC", marginBottom: 12, letterSpacing: "-0.01em" }}>Are you absolutely sure?</h2>
            <p style={{ fontSize: '0.85rem', color: '#C8CAD5', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete the <strong>{profile.workspace}</strong> workspace. Please type <strong style={{ color: '#EF4444' }}>delete</strong> below to confirm.
            </p>

            <input
              style={{ ...inputStyle, marginBottom: 20, borderColor: deleteConfirmText.toLowerCase() === 'delete' ? '#EF4444' : 'var(--border)' }}
              placeholder="Type delete to confirm"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} style={{
                flex: 1, background: "none", border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px", color: "#8F91A2", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
              }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                disabled={deleting || deleteConfirmText.toLowerCase() !== 'delete'}
                style={{
                  flex: 1, background: "#EF4444", border: "none", borderRadius: 8,
                  padding: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem",
                  opacity: deleting || deleteConfirmText.toLowerCase() !== 'delete' ? 0.5 : 1,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                }}
              >
                {deleting ? "Deleting…" : "Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
