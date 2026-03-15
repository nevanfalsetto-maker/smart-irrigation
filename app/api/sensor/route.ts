import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {

  const body = await req.json()

  const { nilai, status, status_pompa, battery } = body

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

  return Response.json({ success: true })
}