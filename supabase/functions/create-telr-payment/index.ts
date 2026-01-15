import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== FUNCTION EXECUTION STARTED ===')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)
    
    // Log all headers (sanitized)
    const headers = {}
    req.headers.forEach((value, key) => {
      headers[key] = key.toLowerCase().includes('auth') ? value.substring(0, 20) + '...' : value
    })
    console.log('Headers received:', JSON.stringify(headers, null, 2))
    
    // Get Telr credentials from environment variables (SECURE!)
    const TELR_STORE_ID = Deno.env.get('TELR_STORE_ID')
    const TELR_AUTH_KEY = Deno.env.get('TELR_AUTH_KEY')
    // Default back to production URL (requires IP whitelisting)
    const TELR_API_URL = Deno.env.get('TELR_API_URL') || 'https://secure.telr.com/gateway/order.json'
    
    console.log('Environment check:', {
      TELR_STORE_ID: TELR_STORE_ID ? 'SET' : 'MISSING',
      TELR_AUTH_KEY: TELR_AUTH_KEY ? 'SET' : 'MISSING',
      TELR_API_URL: TELR_API_URL,
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'MISSING',
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'SET' : 'MISSING',
      SITE_URL: Deno.env.get('SITE_URL') || 'NOT SET'
    })
    
    if (!TELR_STORE_ID || !TELR_AUTH_KEY) {
      console.error('CRITICAL: Telr credentials not configured')
      throw new Error('Telr credentials not configured')
    }
    
    console.log('Telr credentials validated successfully')

    // Get request body
    const { amount, currency, description, orderRef, customerEmail, customerName } = await req.json()

    // Validate input
    if (!amount || !currency || !orderRef) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, currency, orderRef' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('No Authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No auth header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('Auth header present:', authHeader.substring(0, 20) + '...')

    // Create Supabase client to log the transaction
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    console.log('User fetch result:', { user: user?.id, error: userError })
    
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token', details: userError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Prepare Telr payment request (testing with store as string per Telr docs)
    const telrRequest = {
      method: 'create',
      store: TELR_STORE_ID, // Keep as string - Telr docs show it as string
      authkey: TELR_AUTH_KEY,
      order: {
        cartid: orderRef,
        test: 1, // Integer for test mode
        amount: parseFloat(amount).toFixed(2),
        currency: currency
      },
      return: {
        authorised: `${Deno.env.get('SITE_URL')}/payment-success`,
        declined: `${Deno.env.get('SITE_URL')}/payment-failed`,
        cancelled: `${Deno.env.get('SITE_URL')}/payment-cancelled`
      }
    }

    console.log('Telr request (sanitized):', { 
      method: telrRequest.method,
      store: 'REDACTED',
      authkey: 'REDACTED',
      order: {
        cartid: telrRequest.order.cartid,
        test: telrRequest.order.test,
        amount: telrRequest.order.amount,
        currency: telrRequest.order.currency
      },
      return: telrRequest.return
    })

    // Call Telr API
    const telrResponse = await fetch(TELR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telrRequest)
    })

    console.log('Telr HTTP status:', telrResponse.status)

    const telrData = await telrResponse.json()

    console.log('Telr API response:', JSON.stringify(telrData, null, 2))
    console.log('Telr error object:', telrData.error ? JSON.stringify(telrData.error, null, 2) : 'NO ERROR')
    console.log('Telr trace:', telrData.trace ? JSON.stringify(telrData.trace, null, 2) : 'NO TRACE')

    // Check for Telr error responses
    if (telrData.error) {
      const errorMsg = telrData.error.message || telrData.error.note || 'Unknown error'
      const errorCode = telrData.error.code || 'N/A'
      console.error('Telr API error:', { code: errorCode, message: errorMsg, fullError: telrData.error })
      
      // Check if it's an IP whitelist error (though E01 could be other issues too)
      if (errorMsg.includes('unauthorised IP')) {
        throw new Error(`Telr IP Whitelist Error: Your Supabase server IP (35.180.186.5) needs to be whitelisted in Telr. Contact Telr support. Error: ${errorCode}:${errorMsg}`)
      }
      
      // E01 can mean: invalid request format, wrong credentials, or IP issues
      if (errorCode === 'E01') {
        throw new Error(`Telr Request Error (E01): This could mean invalid request format, incorrect credentials, or IP whitelist issues. Please verify: 1) Store ID and Auth Key are correct, 2) IP 35.180.186.5 is whitelisted in Telr for PRODUCTION (not just test mode), 3) Request format matches Telr API docs. Full error: ${errorMsg}`)
      }
      
      throw new Error(`Telr API error: ${errorCode}:${errorMsg}`)
    }

    // Check if order was created successfully
    if (!telrData.order || !telrData.order.url) {
      console.error('Telr response missing order URL:', telrData)
      throw new Error('Telr did not return a payment URL. Response: ' + JSON.stringify(telrData))
    }

    // Log transaction to database
    const { error: logError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        order_ref: orderRef,
        amount: amount,
        currency: currency,
        status: 'pending',
        telr_order_ref: telrData.order?.ref,
        telr_url: telrData.order?.url,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging transaction:', logError)
      // Don't fail the payment flow, just log the error
    }

    // Return payment URL to frontend
    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: telrData.order.url,
        orderRef: telrData.order.ref
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error creating Telr payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
