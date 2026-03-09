import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  const body = await req.json()

  const { nilai, status } = body

  const { error } = await supabase
    .from("soil_monitor")
    .insert([{ nilai, status }])
console.log(error)
  if (error) {
    return Response.json({ error })
  }

  return Response.json({ success: true })
}