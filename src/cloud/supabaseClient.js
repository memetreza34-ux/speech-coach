const DEFAULT_SUPABASE_URL = 'https://jmswsgwnvmvsfayeodcd.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xSJ2M5rIDQ3Y3acgH2IKmg_QYLOTI-R'
const SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.9/+esm'

const projectUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim()
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || DEFAULT_SUPABASE_PUBLISHABLE_KEY
).trim()

let clientPromise = null

export const isCloudConfigured = () => Boolean(projectUrl && publishableKey)

export const getCloudConfiguration = () => ({
  configured: isCloudConfigured(),
  projectUrl,
  sdkVersion: '2.110.9',
})

export const getSupabaseClient = async () => {
  if (!isCloudConfigured()) return null

  if (!clientPromise) {
    clientPromise = import(/* @vite-ignore */ SUPABASE_SDK_URL)
      .then(({ createClient }) => createClient(projectUrl, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'speechcoach-auth',
        },
        global: {
          headers: {
            'X-Client-Info': 'speechcoach-web/1.0',
          },
        },
      }))
      .catch((error) => {
        clientPromise = null
        throw error
      })
  }

  return clientPromise
}
