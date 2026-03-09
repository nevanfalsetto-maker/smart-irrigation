'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {

  const [data, setData] = useState<any>(null)

  const getData = async () => {

    const { data, error } = await supabase
      .from('soil_monitor')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.log(error)
      return
    }

    if (data && data.length > 0) {
      setData(data[0])
    }
  }

  useEffect(() => {

    getData()

    const interval = setInterval(() => {
      getData()
    }, 5000)

    return () => clearInterval(interval)

  }, [])

  const getStatusColor = (status: string) => {
    if (status === "Kering") return "#e74c3c"
    if (status === "Basah") return "#3498db"
    return "#27ae60"
  }

  return (

    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f0f",
      color: "#ffffff",
      padding: 20,
      fontFamily: "Arial, sans-serif"
    }}>

      <div style={{
        width: "100%",
        maxWidth: 420
      }}>

        <h1 style={{
          textAlign: "center",
          marginBottom: 35,
          fontSize: 26
        }}>
          🌱 Smart Irrigation
        </h1>

        {data ? (

          <div style={{
            background: "#1e1e1e",
            borderRadius: 16,
            padding: 30,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>

            {/* Sensor Value */}
            <div style={{ marginBottom: 30 }}>

              <p style={{
                fontSize: 14,
                color: "#aaa",
                marginBottom: 6
              }}>
                Soil Moisture
              </p>

              <p style={{
                fontSize: 52,
                fontWeight: "bold",
                letterSpacing: 1
              }}>
                {data.nilai}
              </p>

            </div>

            {/* Status */}
            <div>

              <p style={{
                fontSize: 14,
                color: "#aaa",
                marginBottom: 8
              }}>
                Status Tanah
              </p>

              <div style={{
                display: "inline-block",
                padding: "8px 18px",
                borderRadius: 20,
                background: getStatusColor(data.status),
                color: "#fff",
                fontWeight: "bold",
                fontSize: 16
              }}>
                {data.status}
              </div>

            </div>

            {/* Update Time */}
            <div style={{
              marginTop: 30,
              fontSize: 12,
              color: "#777"
            }}>
              Last Update: {new Date(data.created_at).toLocaleString()}
            </div>

          </div>

        ) : (

          <div style={{
            background: "#1e1e1e",
            padding: 30,
            borderRadius: 16,
            textAlign: "center",
            color: "#aaa"
          }}>
            Loading sensor data...
          </div>

        )}

      </div>

    </main>
  )
}