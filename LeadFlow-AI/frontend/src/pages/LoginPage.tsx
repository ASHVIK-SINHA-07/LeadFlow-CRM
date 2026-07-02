import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Mail, Lock, User as UserIcon, Loader } from 'lucide-react'
import api from '../services/api'

export default function LoginPage() {
  const { login } = useAuth()
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const path = activeTab === 'login' 
      ? '/api/auth/login' 
      : '/api/auth/register'

    const body = activeTab === 'login'
      ? { email, password }
      : { name, email, password }

    try {
      const data = await api.post(path, body).then(r => r.data)

      if (activeTab === 'login') {
        login(data.token, data.user)
      } else {
        // After signup, automatically log them in
        const loginData = await api.post('/api/auth/login', { email, password }).then(r => r.data)
        login(loginData.token, loginData.user)
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 42px',
    background: '#1A1B26',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#F8FAFC',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.15s ease',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F1015',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: '15%', left: '15%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(94,106,210,0.12) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '15%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 1
      }} />

      {/* Card Container */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#171821',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.25)',
            marginBottom: 16, color: '#5E6AD2'
          }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700,
            color: '#F8FAFC', margin: '0 0 6px 0'
          }}>LeadFlow AI</h2>
          <p style={{ fontSize: '0.85rem', color: '#8F91A2', margin: 0 }}>
            Autonomous CRM & Sales Chief of Staff
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: '#0F1015',
          padding: 4,
          borderRadius: 8,
          marginBottom: 24,
        }}>
          {(['login', 'signup'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError('') }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: activeTab === tab ? '#171821' : 'none',
                color: activeTab === tab ? '#F8FAFC' : '#8F91A2',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Name Field (Sign Up Only) */}
          {activeTab === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#8F91A2', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#5E6AD2'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#8F91A2', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#5E6AD2'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#8F91A2', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525B' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#5E6AD2'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              fontSize: '0.8rem',
              color: '#EF4444',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              padding: '10px 14px',
              borderRadius: 6,
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: '#5E6AD2',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(94, 106, 210, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
              marginTop: 10,
            }}
            onMouseOver={e => !loading && (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={e => !loading && (e.currentTarget.style.opacity = '1')}
          >
            {loading ? (
              <>
                <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                Processing...
              </>
            ) : (
              activeTab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
