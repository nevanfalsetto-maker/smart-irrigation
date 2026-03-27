'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SoilData {
  id: number
  nilai: number
  status: string
  battery: number
  status_pompa: 'ON' | 'OFF'
  created_at: string
}

type PumpState = 'ON' | 'OFF' | 'AUTO'

export default function Home() {
  const [data, setData] = useState<SoilData | null>(null)
  const [pumpState, setPumpState] = useState<PumpState | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const getData = async () => {
    try {
      const { data: res } = await supabase
        .from('soil_system')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      const { data: pumpRes } = await supabase
        .from('pump_control')
        .select('status')
        .eq('id', 1)
        .single()

      if (res && res.length > 0) setData(res[0])
      if (pumpRes && !loading) setPumpState(pumpRes.status as PumpState)

      setLastUpdate(new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const setPump = async (newState: PumpState) => {
    if (loading) return
    const prev = pumpState
    setPumpState(newState)
    setLoading(true)
    try {
      const { error } = await supabase
        .from('pump_control')
        .update({ status: newState })
        .eq('id', 1)
      if (error) { console.error(error); setPumpState(prev) }
    } catch (err) {
      console.error(err); setPumpState(prev)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getData()
    const interval = setInterval(getData, 5000)
    return () => clearInterval(interval)
  }, [])

  // ── helpers ──────────────────────────────────────────────
  const getSoilBadge = (status: string) => {
    switch (status) {
      case 'Kering': return { bg: '#FAECE7', color: '#993C1D', label: 'Kering' }
      case 'Basah':  return { bg: '#E6F1FB', color: '#185FA5', label: 'Basah' }
      default:       return { bg: '#EAF3DE', color: '#3B6D11', label: status }
    }
  }

  const getBatteryColor = (v: number) => {
    if (v >= 12.4) return '#16a34a'
    if (v >= 11.5) return '#ca8a04'
    return '#dc2626'
  }

  const getBatteryWidth = (v: number) => {
    const pct = ((v - 11.0) / (12.6 - 11.0)) * 100
    return `${Math.min(100, Math.max(0, pct)).toFixed(0)}%`
  }

  const badge = getSoilBadge(data?.status ?? '')
  const batColor = data ? getBatteryColor(data.battery) : '#94a3b8'

  const pumpColor = pumpState === 'ON' ? '#16a34a' : pumpState === 'AUTO' ? '#2563eb' : '#64748b'
  const pumpDotColor = pumpState === 'ON' ? '#22c55e' : pumpState === 'AUTO' ? '#60a5fa' : '#475569'

  const btnStyle = (state: PumpState): React.CSSProperties => {
    const active = pumpState === state
    const colors: Record<PumpState, { bg: string; border: string; color: string }> = {
      ON:   { bg: '#dcfce7', border: '#86efac', color: '#166534' },
      OFF:  { bg: '#f1f5f9', border: '#cbd5e1', color: '#334155' },
      AUTO: { bg: '#dbeafe', border: '#93c5fd', color: '#1e40af' },
    }
    return {
      flex: 1,
      padding: '9px 0',
      border: `0.5px solid ${active ? colors[state].border : '#e2e8f0'}`,
      borderRadius: 8,
      background: active ? colors[state].bg : '#fff',
      color: active ? colors[state].color : '#64748b',
      fontFamily: "'DM Mono', monospace",
      fontSize: 13,
      fontWeight: 500,
      cursor: loading ? 'not-allowed' : 'pointer',
      letterSpacing: '0.05em',
      transition: 'all 0.15s ease',
      opacity: loading ? 0.6 : 1,
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      padding: '2rem 1rem 3rem',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(34,197,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18 }}>🌱</span>
          </div>
          <div>
            <h1 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 500, margin: 0 }}>Smart Irrigation</h1>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.25)'
              }} />
              Live monitoring
            </p>
          </div>
        </div>

        {/* ── Row 1: Soil + Battery ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* Soil card */}
          <div style={card}>
            <p style={label}>Kelembapan</p>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 30, fontWeight: 400, color: '#f1f5f9', lineHeight: 1 }}>
              {data?.nilai ?? '—'}
            </div>
            {data?.status && (
              <span style={{
                display: 'inline-block',
                marginTop: 8, padding: '3px 10px', borderRadius: 999,
                fontSize: 12, fontWeight: 500,
                background: badge.bg, color: badge.color,
              }}>
                {badge.label}
              </span>
            )}
          </div>

          {/* Battery card */}
          <div style={card}>
            <p style={label}>Baterai</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              {/* battery body */}
              <div style={{
                width: 44, height: 20,
                border: `1.5px solid ${batColor}`,
                borderRadius: 3, padding: 2,
              }}>
                <div style={{
                  width: data ? getBatteryWidth(data.battery) : '0%',
                  height: '100%', borderRadius: 1,
                  background: batColor,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              {/* tip */}
              <div style={{ width: 4, height: 10, borderRadius: '0 2px 2px 0', background: batColor }} />
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 400, color: '#f1f5f9' }}>
                {data?.battery.toFixed(1) ?? '—'}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>V</span>
            </div>
          </div>
        </div>

        {/* ── Pump card ── */}
        <div style={card}>
          <p style={label}>Kontrol Pompa</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 26, fontWeight: 400, color: pumpColor,
              letterSpacing: '0.04em',
            }}>
              {pumpState ?? '—'}
            </span>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: pumpDotColor,
              display: 'inline-block',
            }} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPump('ON')}  style={btnStyle('ON')}>ON</button>
            <button onClick={() => setPump('OFF')} style={btnStyle('OFF')}>OFF</button>
            <button onClick={() => setPump('AUTO')} style={btnStyle('AUTO')}>AUTO</button>
          </div>
        </div>

        {/* ── Last update ── */}
        {lastUpdate && (
          <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 4 }}>
            Terakhir diperbarui: {lastUpdate}
          </p>
        )}

      </div>
    </main>
  )
}

// ── shared styles ─────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'rgba(30,41,59,0.8)',
  border: '0.5px solid rgba(148,163,184,0.12)',
  borderRadius: 14,
  padding: '1rem 1.1rem',
  backdropFilter: 'blur(8px)',
}

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#475569',
  marginBottom: 10,
}