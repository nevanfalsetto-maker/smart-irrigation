import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {

  const { data } = await supabase
    .from('pump_control')
    .select('*')
    .eq('id',1)
    .single()

  return Response.json(data)
}

export async function POST(req: Request) {

  const body = await req.json()

  await supabase
    .from('pump_control')
    .update({ status: body.status })
    .eq('id',1)

  return Response.json({success:true})
}