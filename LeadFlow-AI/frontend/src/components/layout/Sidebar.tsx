import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Upload, BarChart2, Bot, Settings, Sparkles, BellRing, Archive } from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/'          },
  { icon: Users,           label: 'Leads',         to: '/leads'     },
  { icon: Bot,             label: 'AI Agents',     to: '/agents'    },
  { icon: BarChart2,       label: 'Analytics',     to: '/analytics' },
  { icon: Upload,          label: 'Upload',        to: '/upload'    },
  { icon: Sparkles,        label: 'Morning Brief', to: '/brief'     },
  { icon: BellRing,        label: 'Alerts',        to: '/alerts'    },
  { icon: Archive,         label: 'Archive',       to: '/archive'   },
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 240,
      display: 'flex', flexDirection: 'column',
      background: '#171821',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      zIndex: 100,
      padding: '0 12px',
    }}>

      {/* Wordmark */}
      <div style={{ padding: '24px 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#5E6AD2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            flexShrink: 0, letterSpacing: '-0.01em',
          }}>
            LF
          </div>
          <div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600, fontSize: '0.95rem',
              color: '#F8FAFC', letterSpacing: '-0.01em',
            }}>
              LeadFlow
            </div>
            <div style={{ fontSize: '0.68rem', color: '#8F91A2', marginTop: 1 }}>
              AI CRM
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em',
          color: '#8F91A2', padding: '0 8px 8px', textTransform: 'uppercase',
        }}>
          Menu
        </div>
        {NAV.map(({ icon: Icon, label, to }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to))
          return (
            <Link key={to} to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
              <Icon size={18} style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 0 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link to="/settings" className={`sidebar-item ${pathname === '/settings' ? 'active' : ''}`} style={{ marginBottom: 12 }}>
          <Settings size={18} style={{ opacity: pathname === '/settings' ? 1 : 0.6 }} />
          <span>Settings</span>
        </Link>
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: '#8F91A2' }}>Command palette</span>
          <kbd style={{
            fontSize: '0.68rem', color: '#8F91A2',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '2px 6px',
          }}>⌘K</kbd>
        </div>
      </div>
    </aside>
  )
}