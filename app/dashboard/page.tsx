import { supabase } from "@/lib/supabase"
import SensorCard from "@/components/sensorCards"

export default async function Dashboard() {

  const { data } = await supabase
    .from("soil_monitor")
    .select("*")
    .order("created_at", { ascending:false })
    .limit(20)

  return (
    <div style={{padding:"40px"}}>

      <h1>Smart Irrigation Dashboard</h1>

      {data?.map((item) => (
        <SensorCard
          key={item.id}
          nilai={item.nilai}
          status={item.status}
        />
      ))}

    </div>
  )
}