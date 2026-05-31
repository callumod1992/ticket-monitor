'use client'

import { useState, useEffect, useCallback } from 'react'

interface Listing {
  price: number
  section?: string
  row?: string
  quantity?: string
}

interface SiteResult {
  label: string
  url: string
  checkedAt: string
  lowestPrice: number | null
  listings: Listing[]
  error?: string
}

interface CheckResult {
  checkedAt: string
  overallLowest: number | null
  results: SiteResult[]
}

const DEFAULT_SITES = [
  { id: 1, label: 'Vivid Seats', url: '' },
  { id: 2, label: '', url: '' },
  { id: 3, label: '', url: '' },
]

const AUTO_REFRESH_MS = 2 * 60 * 60 * 1000 // 2 hours

export default function Home() {
  const [sites, setSites] = useState(DEFAULT_SITES)
  const [nextId, setNextId] = useState(4)
  const [alertEmail, setAlertEmail] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [history, setHistory] = useState<{ time: string; lowest: number | null }[]>([])
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(true)

  const checkPrices = useCallback(async () => {
    const activeSites = sites.filter(s => s.url.trim())
    if (!activeSites.length) {
      setError('Please add at least one ticket site URL.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/check-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sites: activeSites.map(s => ({ label: s.label || getDomain(s.url), url: s.url })),
          alertEmail: alertEmail || null,
          targetPrice: targetPrice ? parseInt(targetPrice) : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Check failed')

      setResult(data)
      setHistory(prev => [
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), lowest: data.overallLowest },
        ...prev.slice(0, 9),
      ])

      // Schedule next auto-refresh
      const next = new Date(Date.now() + AUTO_REFRESH_MS)
      setNextRefresh(next)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sites, alertEmail, targetPrice])

  // Auto-refresh
  useEffect(() => {
    if (!nextRefresh) return
    const ms = nextRefresh.getTime() - Date.now()
    if (ms <= 0) return
    const t = setTimeout(() => checkPrices(), ms)
    return () => clearTimeout(t)
  }, [nextRefresh, checkPrices])

  function getDomain(url: string) {
    try { return new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', '') }
    catch { return url || 'Site' }
  }

  function addSite() {
    setSites(prev => [...prev, { id: nextId, label: '', url: '' }])
    setNextId(n => n + 1)
  }

  function removeSite(id: number) {
    setSites(prev => prev.filter(s => s.id !== id))
  }

  function updateSite(id: number, field: 'label' | 'url', val: string) {
    setSites(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s))
  }

  const overallLowest = result?.overallLowest

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e0', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>🎟 Haiti vs Scotland</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>World Cup Group C · Gillette Stadium, Foxborough MA · Jun 13</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#aaa' }}>
          {result && <div>Last checked: {new Date(result.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
          {nextRefresh && <div>Next auto-check: {nextRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        {/* Lowest price summary */}
        {overallLowest !== undefined && overallLowest !== null && (
          <div style={{ background: '#fff', border: '2px solid #1D9E75', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#1D9E75' }}>${overallLowest}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Lowest price found</div>
              <div style={{ fontSize: 13, color: '#888' }}>
                via {result?.results.find(r => r.lowestPrice === overallLowest)?.label}
                {targetPrice && overallLowest <= parseInt(targetPrice) && (
                  <span style={{ marginLeft: 8, background: '#E1F5EE', color: '#085041', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                    ✓ Below your ${targetPrice} target
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginBottom: 20 }}>
            {result.results.map(r => {
              const isBest = r.lowestPrice === overallLowest
              return (
                <div key={r.url} style={{
                  background: '#fff',
                  border: isBest ? '2px solid #1D9E75' : '1px solid #e5e5e0',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{r.label}</span>
                      {isBest && <span style={{ background: '#E1F5EE', color: '#085041', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>lowest</span>}
                      {r.error && <span style={{ background: '#FAECE7', color: '#712B13', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>error</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 2, wordBreak: 'break-all' }}>{r.url}</div>
                    {r.error && <div style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{r.error}</div>}
                    {r.listings.length > 0 && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        {r.listings.slice(0, 5).map((l, i) => (
                          <span key={i} style={{ marginRight: 12 }}>
                            ${l.price}{l.section ? ` · Sec ${l.section}` : ''}{l.row ? ` Row ${l.row}` : ''}
                          </span>
                        ))}
                        {r.listings.length > 5 && <span style={{ color: '#bbb' }}>+{r.listings.length - 5} more</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    {r.lowestPrice
                      ? <div style={{ fontSize: 24, fontWeight: 700, color: isBest ? '#1D9E75' : '#222' }}>${r.lowestPrice}</div>
                      : <div style={{ fontSize: 13, color: '#aaa' }}>—</div>
                    }
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>
                      View →
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Settings panel */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <button
            onClick={() => setShowSettings(s => !s)}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}
          >
            <span>⚙️ Sites &amp; settings</span>
            <span style={{ color: '#aaa', fontSize: 12 }}>{showSettings ? 'hide ▲' : 'show ▼'}</span>
          </button>

          {showSettings && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0ec' }}>
              <div style={{ fontSize: 12, color: '#888', margin: '12px 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Ticket sites</div>
              {sites.map(s => (
                <div key={s.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Site label"
                    value={s.label}
                    onChange={e => updateSite(s.id, 'label', e.target.value)}
                    style={{ width: 130, padding: '8px 10px', border: '1px solid #e5e5e0', borderRadius: 6, fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="https://www.vividseats.com/..."
                    value={s.url}
                    onChange={e => updateSite(s.id, 'url', e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #e5e5e0', borderRadius: 6, fontSize: 13 }}
                  />
                  {sites.length > 1 && (
                    <button onClick={() => removeSite(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, padding: '0 4px' }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addSite} style={{ fontSize: 13, color: '#185FA5', background: 'none', border: '1px dashed #c0d4e8', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', width: '100%', marginTop: 4 }}>
                + Add another site
              </button>

              <div style={{ fontSize: 12, color: '#888', margin: '16px 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Price alert</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid #e5e5e0', borderRadius: 6, fontSize: 13 }}
                />
                <input
                  type="number"
                  placeholder="Target $ price"
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  style={{ width: 140, padding: '8px 10px', border: '1px solid #e5e5e0', borderRadius: 6, fontSize: 13 }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
                You'll get an email when any site drops below your target price.
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#FAECE7', border: '1px solid #F5C4B3', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#712B13', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={checkPrices}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
            background: loading ? '#aaa' : '#1D9E75', color: '#fff',
            border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Checking prices...' : '🔍 Check prices now'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 20, background: '#fff', border: '1px solid #e5e5e0', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Check history</div>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f5f5f0', color: '#555' }}>
                <span>{h.time}</span>
                <span style={{ fontWeight: 600 }}>{h.lowest ? `$${h.lowest}` : '—'}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
