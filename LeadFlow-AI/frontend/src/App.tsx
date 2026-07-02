import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Background from './components/layout/Background'
import Sidebar from './components/layout/Sidebar'
import LoadingScreen from './components/LoadingScreen'
import CommandPalette from './components/CommandPalette'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Upload from './pages/Upload'
import AIAgents from './pages/AIAgents'
import Analytics from './pages/Analytics'
import Brief from './pages/Brief'
import Alerts from './pages/Alerts'
import ArchivePage from './pages/Archive'
import Settings from './pages/Settings'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'

function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  const [loaded, setLoaded] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading) {
    return <LoadingScreen onComplete={() => {}} />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0F1015' }}>
      <Background />
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      {loaded && (
        <>
          <Sidebar />
          <main>
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/leads"     element={<Leads />} />
              <Route path="/upload"    element={<Upload />} />
              <Route path="/agents"    element={<AIAgents />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/brief"     element={<Brief />} />
              <Route path="/alerts"    element={<Alerts />} />
              <Route path="/archive"   element={<ArchivePage />} />
              <Route path="/settings"  element={<Settings />} />
            </Routes>
          </main>
        </>
      )}
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}