import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  const body = await req.json()
  const { nilai, status, status_pompa, battery } = body

  // 1. SIMPAN DATA SENSOR
  const { error } = await supabase
    .from("soil_system")
    .insert([
      {
        nilai,
        status,
        status_pompa,
        battery
      }
    ])

  if (error) {
    console.log(error)
    return Response.json({ error })
  }

  // 2. AMBIL STATUS POMPA DARI DB
  const { data: pump } = await supabase
    .from("pump_control")
    .select("status")
    .eq("id", 1)
    .single()

  // 3. BALIKIN KE ESP
  return Response.json({
    success: true,
    pump_status: pump?.status || "AUTO"
  })
}