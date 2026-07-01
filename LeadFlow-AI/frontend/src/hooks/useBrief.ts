import { useState, useEffect } from 'react'

export interface BriefLead {
  id: number
  name: string
  company: string
  reason?: string
  warmth: number
  promise?: string
  daysOverdue?: number
  lastContact?: string
}

export interface BriefData {
  topCalls: BriefLead[]
  promisesDue: BriefLead[]
  atRisk: BriefLead[]
  generatedAt: string
}

const CACHE_KEY = 'leadflow_brief_cache'
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

function isCacheValid(cached: { timestamp: number; data: BriefData }) {
  return Date.now() - cached.timestamp < CACHE_TTL
}

export function useBrief(leads: any[]) {
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leads || leads.length === 0) return
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw)
        if (isCacheValid(cached)) {
          setBrief(cached.data)
          setLoading(false)
          return
        }
      }
    } catch {}
    generateBrief()
  }, [leads])

  async function generateBrief() {
    if (!leads || leads.length === 0) return
    setLoading(true)
    setError(null)

    // Map to our backend's field names
    const snapshot = leads.map(l => ({
      id: l.id,
      name: l.name,
      company: l.company,
      warmth: l.warmthScore,
      daysSinceContact: l.daysSinceContact,
      overdueFollowUp: l.overdueFollowUp,
      promises: l.promises ?? [],
      status: l.status,
    }))

    const prompt = `You are an AI sales assistant for LeadFlow AI CRM.
Today: ${new Date().toDateString()}

Leads data:
${JSON.stringify(snapshot, null, 2)}

Generate a morning brief. Return ONLY valid JSON, no markdown:
{
  "topCalls": [
    { "id": 1, "name": "...", "company": "...", "reason": "specific 1-sentence why to call today", "warmth": 0 }
  ],
  "promisesDue": [
    { "id": 1, "name": "...", "company": "...", "promise": "what was promised", "daysOverdue": 0, "warmth": 0 }
  ],
  "atRisk": [
    { "id": 1, "name": "...", "company": "...", "warmth": 0, "lastContact": "Xd ago" }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Rules:
- topCalls: up to 3 leads — prioritise overdueFollowUp=true or warmth dropping fast
- promisesDue: leads with promises[] not empty AND overdueFollowUp=true
- atRisk: leads with warmth < 35
- reason must be specific and actionable, not generic
- if a section has no matches, return empty array []`

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      const text = data.text ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed: BriefData = JSON.parse(clean)

      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: parsed }))
      setBrief(parsed)
    } catch {
      // Fallback brief from local data
      const overdue = leads.filter(l => l.overdueFollowUp)
      const atRisk = leads.filter(l => l.warmthScore < 35)
      const withPromises = leads.filter(l => l.promises?.length > 0 && l.overdueFollowUp)

      const fallback: BriefData = {
        topCalls: overdue.slice(0, 3).map(l => ({
          id: l.id, name: l.name, company: l.company,
          reason: `No contact in ${l.daysSinceContact} days — warmth at ${l.warmthScore}. Follow up now.`,
          warmth: l.warmthScore,
        })),
        promisesDue: withPromises.slice(0, 3).map(l => ({
          id: l.id, name: l.name, company: l.company,
          promise: l.promises[0], daysOverdue: l.daysSinceContact - 3,
          warmth: l.warmthScore,
        })),
        atRisk: atRisk.slice(0, 3).map(l => ({
          id: l.id, name: l.name, company: l.company,
          warmth: l.warmthScore, lastContact: `${l.daysSinceContact}d ago`,
        })),
        generatedAt: new Date().toISOString(),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: fallback }))
      setBrief(fallback)
      setError('AI unavailable — showing data-based brief instead.')
    } finally {
      setLoading(false)
    }
  }

  return { brief, loading, error, refresh: generateBrief }
}