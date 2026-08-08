const failures = []
const warnings = []

const fail = (message) => failures.push(message)
const warn = (message) => warnings.push(message)
const value = (name) => String(process.env[name] || '').trim()

const productionUrlRaw = value('SPEECHCOACH_PRODUCTION_URL')
const openAiKey = value('OPENAI_API_KEY')
const browserOpenAiKey = value('VITE_OPENAI_API_KEY')
const supabaseUrlRaw = value('VITE_SUPABASE_URL')
const supabaseKey = value('VITE_SUPABASE_PUBLISHABLE_KEY') || value('VITE_SUPABASE_ANON_KEY')
const originsRaw = value('SPEECHCOACH_ALLOWED_ORIGINS')

const parseHttpsOrigin = (raw, label, { required = true } = {}) => {
  if (!raw) {
    if (required) fail(`${label} fehlt.`)
    return null
  }
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') fail(`${label} muss HTTPS verwenden.`)
    if (parsed.username || parsed.password) fail(`${label} darf keine Zugangsdaten enthalten.`)
    if (parsed.search || parsed.hash) fail(`${label} darf keine Query oder Fragment enthalten.`)
    return parsed
  } catch {
    fail(`${label} ist keine gültige URL.`)
    return null
  }
}

const productionUrl = parseHttpsOrigin(productionUrlRaw, 'SPEECHCOACH_PRODUCTION_URL')
const supabaseUrl = parseHttpsOrigin(supabaseUrlRaw, 'VITE_SUPABASE_URL')

if (productionUrl && productionUrl.pathname !== '/' && productionUrl.pathname !== '') {
  warn('SPEECHCOACH_PRODUCTION_URL enthält einen Pfad. SpeechCoach ist aktuell für Root-Deployment ausgelegt.')
}

if (!openAiKey) fail('OPENAI_API_KEY fehlt.')
else if (openAiKey.length < 20) fail('OPENAI_API_KEY wirkt zu kurz.')

if (browserOpenAiKey) fail('VITE_OPENAI_API_KEY darf niemals gesetzt sein.')

if (!supabaseKey) fail('VITE_SUPABASE_PUBLISHABLE_KEY fehlt.')
else if (/service_role/i.test(supabaseKey)) fail('Ein Supabase service_role-Key darf niemals im Frontend verwendet werden.')
else if (!(supabaseKey.startsWith('sb_publishable_') || supabaseKey.length > 80)) {
  warn('Der Supabase-Key sieht nicht wie ein üblicher Publishable-/Anon-Key aus. Manuell prüfen.')
}

if (supabaseUrl && !/\.supabase\.co$/i.test(supabaseUrl.hostname)) {
  warn('VITE_SUPABASE_URL verwendet keine supabase.co-Domain. Bei Custom Domain manuell prüfen.')
}

if (originsRaw) {
  const origins = originsRaw.split(',').map((item) => item.trim()).filter(Boolean)
  for (const originRaw of origins) {
    const parsed = parseHttpsOrigin(originRaw, `SPEECHCOACH_ALLOWED_ORIGINS Eintrag ${originRaw}`)
    if (parsed && parsed.pathname !== '/') fail(`SPEECHCOACH_ALLOWED_ORIGINS darf nur Origins ohne Pfad enthalten: ${originRaw}`)
  }
  if (productionUrl && origins.some((origin) => {
    try { return new URL(origin).origin === productionUrl.origin } catch { return false }
  })) {
    warn('Die Produktions-Origin steht explizit in SPEECHCOACH_ALLOWED_ORIGINS, obwohl same-origin automatisch erlaubt ist.')
  }
}

for (const warning of warnings) console.warn(`WARN  ${warning}`)
for (const failure of failures) console.error(`FAIL  ${failure}`)

if (failures.length) {
  console.error(`\nProduction environment: ${failures.length} Fehler, ${warnings.length} Warnungen.`)
  process.exit(1)
}

console.log(`Production environment validiert${warnings.length ? ` (${warnings.length} Warnungen)` : ''}.`)
