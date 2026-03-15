import { supabase } from "@/lib/supabase"

// =================
// GET STATUS POMPA
// =================

export async function GET() {

  const { data, error } = await supabase
    .from("pump_control")
    .select("status")
    .eq("id", 1)
    .single()

  if (error) {
    console.log(error)
    return Response.json({ error })
  }

  return Response.json(data)
}


// =================
// UPDATE STATUS
// =================

export async function POST(req: Request) {

  const body = await req.json()

  const { error } = await supabase
    .from("pump_control")
    .update({ status: body.status })
    .eq("id", 1)

  if (error) {
    console.log(error)
    return Response.json({ error })
  }

  return Response.json({ success: true })
}