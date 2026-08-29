import { createClient } from 'npm:@supabase/supabase-js@2.111.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const authorization = request.headers.get('Authorization') || ''
  if (!authorization.startsWith('Bearer ')) return json({ error: 'Anmeldung erforderlich.' }, 401)

  const projectUrl = Deno.env.get('SUPABASE_URL') || ''
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!projectUrl || !publishableKey || !serviceRoleKey) return json({ error: 'Serverkonfiguration unvollständig.' }, 500)

  const userClient = createClient(projectUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: userData, error: userError } = await userClient.auth.getUser()
  const user = userData?.user
  if (userError || !user) return json({ error: 'Sitzung konnte nicht bestätigt werden.' }, 401)

  let payload: { email?: string; confirmation?: string }
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Ungültige Anfrage.' }, 400)
  }

  const submittedEmail = String(payload.email || '').trim().toLowerCase()
  const accountEmail = String(user.email || '').trim().toLowerCase()
  if (!accountEmail || submittedEmail !== accountEmail) return json({ error: 'Die eingegebene E-Mail stimmt nicht mit dem Konto überein.' }, 400)
  if (payload.confirmation !== 'KONTO LÖSCHEN') return json({ error: 'Bestätigungstext ist nicht korrekt.' }, 400)

  const adminClient = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id, false)
  if (deleteError) {
    console.error('SpeechCoach account deletion failed', { userId: user.id, message: deleteError.message })
    return json({ error: 'Konto konnte nicht vollständig gelöscht werden.' }, 500)
  }

  return json({ deleted: true })
})
