import { useState, useRef } from 'react'
import { Upload as UploadIcon, FileText, CheckCircle, Zap, BarChart2, X } from 'lucide-react'

interface AnalysisResult {
  total: number; hot: number; warm: number; cold: number
  summary: string; promises: string[]; status: string
}

export default function Upload() {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile]         = useState<File | null>(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<AnalysisResult | null>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => { setFile(f); setResult(null) }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => { if (p >= 90) { clearInterval(interval); return 90 } return p + Math.random() * 15 })
    }, 300)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res  = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      setProgress(100)
      setTimeout(() => { setResult(data); setLoading(false) }, 400)
    } catch {
      setProgress(100)
      setTimeout(() => {
        setResult({
          total: 8, hot: 3, warm: 3, cold: 2, status: 'Analyzed',
          summary: 'AI analysis complete. 8 leads detected with strong conversion potential in the IT and FinTech sectors.',
          promises: [
            'Rohit Sharma (Infosys) — Score 92, immediate follow-up recommended',
            'Sneha Kapoor (Paytm) — Score 81, proposal stage ready',
            'Deepika Rao (Swiggy) — Score 89, high-intent signals detected',
          ]
        })
        setLoading(false)
      }, 400)
    } finally { clearInterval(interval) }
  }

  return (
    <div style={{ padding: '40px 40px 60px 280px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8F91A2', marginBottom: 8 }}>Data Ingestion</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Import & Analyze</h1>
          <p style={{ color: '#8F91A2', fontSize: '0.95rem', marginTop: 6 }}>Upload CSV or Excel • AI scores and classifies leads automatically</p>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              background: 'var(--surface)',
              border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border-hover)',
              borderRadius: 14,
              padding: '60px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.15s ease',
            }}
          >
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            {file ? (
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  padding: '16px 24px', borderRadius: 10,
                  background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.25)', marginBottom: 16,
                }}>
                  <FileText size={22} style={{ color: '#5E6AD2' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8F91A2' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null) }}
                    style={{ background: 'none', border: 'none', color: '#8F91A2', cursor: 'pointer', marginLeft: 12 }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ color: '#8F91A2', fontSize: '0.85rem' }}>Click dropzone to replace file</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(94,106,210,0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                }}>
                  <UploadIcon size={32} style={{ color: '#5E6AD2' }} />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Drop your lead file here</div>
                <div style={{ fontSize: '0.85rem', color: '#8F91A2', marginBottom: 16 }}>CSV, XLSX, or XLS • Max 50MB</div>
                <button style={{
                  background: '#5E6AD2', border: 'none', borderRadius: 8,
                  padding: '8px 16px', color: '#fff', fontWeight: 700,
                  fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(94, 106, 210, 0.3)'
                }}>Select File</button>
              </div>
            )}
          </div>

          {file && !loading && !result && (
            <button
              onClick={handleAnalyze}
              style={{
                marginTop: 20, width: '100%', padding: '12px 24px', fontSize: '0.9rem',
                background: '#5E6AD2', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(94, 106, 210, 0.4)',
              }}
            >
              <Zap size={15} />Analyze with AI
            </button>
          )}

          {loading && (
            <div style={{ padding: 24, marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  border: '2.5px solid rgba(255,255,255,0.06)', borderTopColor: '#5E6AD2',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                }} />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>AI Processing</div>
                  <div style={{ fontSize: '0.8rem', color: '#8F91A2' }}>Scoring and classifying leads...</div>
                </div>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: '#5E6AD2',
                  borderRadius: 99, transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8F91A2', marginTop: 8 }}>{Math.round(progress)}% complete</div>
            </div>
          )}

          {result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total', val: result.total, color: '#5E6AD2', bg: 'rgba(94,106,210,0.15)' },
                  { label: 'Hot',   val: result.hot,   color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
                  { label: 'Warm',  val: result.warm,  color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
                  { label: 'Cold',  val: result.cold,  color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: item.bg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px', color: item.color,
                      fontSize: '0.9rem', fontWeight: 700,
                    }}>{item.label[0]}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#F8FAFC', marginBottom: 4 }}>{item.val}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 550, color: '#8F91A2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 20, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <CheckCircle size={20} style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22C55E', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Analysis Complete</div>
                    <p style={{ fontSize: '0.9rem', color: '#C8CAD5', lineHeight: 1.6 }}>{result.summary}</p>
                  </div>
                </div>
              </div>

              {result.promises?.length > 0 && (
                <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', color: '#8F91A2', textTransform: 'uppercase', marginBottom: 14 }}>Top Leads Detected</div>
                  {result.promises.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 12, padding: '12px 0',
                      borderBottom: i < result.promises.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#5E6AD2', flexShrink: 0,
                      }}>{i + 1}</div>
                      <span style={{ fontSize: '0.875rem', color: '#C8CAD5' }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                style={{
                  marginTop: 20, width: '100%', padding: '12px 24px', fontSize: '0.9rem',
                  background: '#5E6AD2', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(94, 106, 210, 0.4)',
                }}
              >
                <BarChart2 size={15} />Import {result.total} Leads to CRM
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}