// Secure Admin Verification - Server-side only!
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    // Get SECURE admin credentials from Supabase secrets (not exposed to browser!)
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@eyycourses.com'

    // Verify admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin verified',
          isAdmin: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Invalid credentials
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid credentials' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
