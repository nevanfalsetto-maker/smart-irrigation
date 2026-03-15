'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {

  const [data,setData] = useState<any>(null)

  const getData = async () => {

    const { data } = await supabase
      .from('soil_system')
      .select('*')
      .order('created_at',{ascending:false})
      .limit(1)

    if(data && data.length > 0){
      setData(data[0])
    }

  }

  const togglePump = async () => {

    if(!data) return

    const newState = data.status_pompa === "ON" ? "OFF" : "ON"

    await supabase
      .from('pump_control')
      .update({ status:newState })
      .eq('id',1)

    setData({
      ...data,
      status_pompa:newState
    })

  }

  useEffect(()=>{

    getData()

    const interval = setInterval(()=>{
      getData()
    },5000)

    return ()=> clearInterval(interval)

  },[])

  const soilColor = (status:string)=>{
    if(status === "Kering") return "#e74c3c"
    if(status === "Basah") return "#3498db"
    return "#27ae60"
  }

  return(

    <main style={{
      minHeight:"100vh",
      background:"#0f172a",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      color:"#fff",
      fontFamily:"Arial"
    }}>

      <div style={{
        width:420,
        background:"#1e293b",
        padding:30,
        borderRadius:20,
        boxShadow:"0 15px 40px rgba(0,0,0,0.4)"
      }}>

        <h1 style={{
          textAlign:"center",
          marginBottom:30
        }}>
          🌱 Smart Irrigation
        </h1>

        {/* Soil Moisture */}

        <div style={{marginBottom:25}}>

          <p style={{color:"#94a3b8",fontSize:14}}>
            Soil Moisture
          </p>

          <h2 style={{fontSize:48,fontWeight:"bold"}}>
            {data?.nilai ?? "-"}
          </h2>

        </div>


        {/* Status Tanah */}

        <div style={{marginBottom:25}}>

          <p style={{color:"#94a3b8",fontSize:14}}>
            Soil Status
          </p>

          <div style={{
            display:"inline-block",
            padding:"6px 16px",
            borderRadius:20,
            background:soilColor(data?.status),
            fontWeight:"bold"
          }}>
            {data?.status}
          </div>

        </div>


        {/* Battery */}

        <div style={{marginBottom:25}}>

          <p style={{color:"#94a3b8",fontSize:14}}>
            Battery Voltage
          </p>

          <h3 style={{fontSize:26}}>
            {data?.battery ?? "-"} V
          </h3>

        </div>


        {/* Pump Control */}

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          marginTop:20
        }}>

          <div>

            <p style={{color:"#94a3b8",fontSize:14}}>
              Pump
            </p>

            <h3>
              {data?.status_pompa ?? "-"}
            </h3>

          </div>


          {/* Toggle */}

          <div
            onClick={togglePump}
            style={{
              width:60,
              height:30,
              background:data?.status_pompa === "ON" ? "#22c55e" : "#64748b",
              borderRadius:50,
              position:"relative",
              cursor:"pointer",
              transition:"0.3s"
            }}
          >

            <div style={{
              width:26,
              height:26,
              background:"#fff",
              borderRadius:"50%",
              position:"absolute",
              top:2,
              left:data?.status_pompa === "ON" ? 32 : 2,
              transition:"0.3s"
            }}/>

          </div>

        </div>


        {/* Last Update */}

        <p style={{
          marginTop:30,
          fontSize:12,
          color:"#94a3b8",
          textAlign:"center"
        }}>
          Last Update: {data ? new Date(data.created_at).toLocaleString() : "-"}
        </p>

      </div>

    </main>

  )

}