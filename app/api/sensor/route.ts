import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {

  const body = await req.json()

  const { nilai, status, status_pompa, battery } = body

  const { error } = await supabase
    .from('soil_system')
    .insert({
      nilai,
      status,
      status_pompa,
      battery
    })

  if (error) {
    return Response.json({ error })
  }

  return Response.json({ success: true })
}