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

export default function Home() {
  const [data, setData] = useState<SoilData | null>(null)
  const [pumpState, setPumpState] = useState<'ON' | 'OFF' | null>(null)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(true)

  // ===================
  // Fetch latest data
  // ===================
const getData = async () => {
  try {
    // Fetch sensor data
    const { data: res, error } = await supabase
      .from('soil_system')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    // Fetch pump status — dari pump_control, bukan soil_system
    const { data: pumpRes, error: pumpError } = await supabase
      .from('pump_control')
      .select('status')
      .eq('id', 1)
      .single()

    if (error) console.log(error)
    if (pumpError) console.log(pumpError)

    if (res && res.length > 0) setData(res[0])

    // Set pumpState dari pump_control
    if (pumpRes && !loading) {
      setPumpState(pumpRes.status as 'ON' | 'OFF')
    }

  } catch (err) {
    console.log(err)
  }
}
  // ===================
  // Toggle Pump
  // ===================
  const togglePump = async () => {
    if (pumpState === null || loading) return

    const prevState = pumpState // simpan state sebelumnya untuk rollback
    const newState: 'ON' | 'OFF' = pumpState === 'ON' ? 'OFF' : 'ON'

    setPumpState(newState) // optimistic update
    setLoading(true)

    try {
      const { error } = await supabase
        .from('pump_control')
        .update({ status: newState })
        .eq('id', 1)

      if (error) {
        console.error('Toggle error:', error)
        setPumpState(prevState) // rollback pakai variable lokal
      }
    } catch (err) {
      console.error('Unexpected toggle error:', err)
      setPumpState(prevState) // rollback
    } finally {
      setLoading(false)
    }
  }

  // ===================
  // Polling every 5 sec
  // ===================
  useEffect(() => {
    getData()
    const interval = setInterval(getData, 5000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ===================
  // Helpers
  // ===================
  const getMoisturePercent = (nilai: number) => {
    // Sesuaikan range sensor kamu (misal: 0-1023 → 0-100%)
    const pct = Math.round((nilai / 1023) * 100)
    return Math.min(100, Math.max(0, pct))
  }

  const getSoilStyle = (status: string) => {
    switch (status) {
      case 'Kering':  return { bg: '#fee2e2', color: '#991b1b', label: 'Dry' }
      case 'Basah':   return { bg: '#dbeafe', color: '#1e40af', label: 'Wet' }
      default:        return { bg: '#dcfce7', color: '#166534', label: 'Optimal' }
    }
  }

  const getBatteryColor = (v: number) => {
    if (v >= 3.7) return '#16a34a'
    if (v >= 3.4) return '#d97706'
    return '#dc2626'
  }

  const getBatteryWidth = (v: number) => {
    // Asumsi range baterai 3.0V - 4.2V
    const pct = ((v - 3.0) / (4.2 - 3.0)) * 100
    return `${Math.min(100, Math.max(0, pct))}%`
  }

  const soilStyle = getSoilStyle(data?.status ?? '')

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: '20px',
    }}>

      <div style={{
        width: '100%',
        maxWidth: 440,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
          <h1 style={{
            color: '#f8fafc',
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.3px',
          }}>
            Smart Irrigation
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
              boxShadow: connected ? '0 0 6px #22c55e88' : '0 0 6px #ef444488',
            }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Soil Moisture Card */}
        <div style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: '20px 24px',
          border: '1px solid #334155',
        }}>
          <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
            Soil Moisture
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
              {data?.nilai ?? '—'}
            </span>
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  background: soilStyle.bg,
                  color: soilStyle.color,
                }}
              >
                {data?.status ?? '—'}
              </span>
            </div>
          </div>

          {/* Moisture bar */}
          <div style={{ background: '#0f172a', borderRadius: 6, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: data ? `${getMoisturePercent(data.nilai)}%` : '0%',
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              borderRadius: 6,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Battery Card */}
        <div style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: '20px 24px',
          border: '1px solid #334155',
        }}>
          <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
            Battery
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Battery icon */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 22,
                border: `2px solid ${data ? getBatteryColor(data.battery) : '#475569'}`,
                borderRadius: 4,
                padding: 2,
                position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  width: data ? getBatteryWidth(data.battery) : '0%',
                  background: data ? getBatteryColor(data.battery) : '#475569',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              {/* Battery tip */}
              <div style={{
                width: 4, height: 10,
                background: data ? getBatteryColor(data.battery) : '#475569',
                borderRadius: '0 2px 2px 0',
                marginLeft: -1,
              }} />
            </div>

            <span style={{
              fontSize: 26,
              fontWeight: 700,
              color: data ? getBatteryColor(data.battery) : '#475569',
            }}>
              {data?.battery ?? '—'} <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>V</span>
            </span>
          </div>
        </div>

        {/* Pump Control Card */}
        <div style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: '20px 24px',
          border: '1px solid #334155',
        }}>
          <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
            Pump Control
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: pumpState === 'ON' ? '#22c55e' : '#64748b',
                transition: 'color 0.3s',
              }}>
                {pumpState ?? '—'}
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                {loading ? 'Updating...' : pumpState === 'ON' ? 'Pump is running' : 'Pump is stopped'}
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={togglePump}
              disabled={pumpState === null || loading}
              aria-label="Toggle pump"
              style={{
                width: 64,
                height: 34,
                background: pumpState === 'ON' ? '#16a34a' : '#334155',
                borderRadius: 34,
                border: 'none',
                cursor: (pumpState === null || loading) ? 'not-allowed' : 'pointer',
                padding: 0,
                position: 'relative',
                transition: 'background 0.3s ease',
                opacity: loading ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                background: '#fff',
                borderRadius: '50%',
                position: 'absolute',
                top: 3,
                left: pumpState === 'ON' ? 33 : 3,
                transition: 'left 0.3s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>

        {/* Last Update */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', margin: 0 }}>
          Last update:{' '}
          <span style={{ color: '#64748b' }}>
            {data ? new Date(data.created_at).toLocaleString('id-ID') : '—'}
          </span>
        </p>

      </div>
    </main>
  )
}