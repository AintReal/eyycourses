import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const TELR_AUTH_KEY = Deno.env.get('TELR_AUTH_KEY')
    const TELR_API_URL = Deno.env.get('TELR_API_URL') || 'https://secure.telr.com/gateway/order.json'

    // Get order reference from query parameters
    const url = new URL(req.url)
    const orderRef = url.searchParams.get('order_ref')
    
    if (!orderRef) {
      return new Response(
        JSON.stringify({ error: 'Missing order_ref parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase admin client (for webhook, we don't have user auth)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for admin access
    )

    // Check payment status with Telr
    const statusRequest = {
      method: 'check',
      order: {
        ref: orderRef
      }
    }

    console.log('Checking Telr payment status for order:', orderRef)

    const telrResponse = await fetch(TELR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusRequest)
    })

    const telrData = await telrResponse.json()
    console.log('Telr status response:', telrData)

    if (telrData.error) {
      throw new Error(`Telr API error: ${telrData.error.message}`)
    }

    const status = telrData.order?.status
    const transactionRef = telrData.order?.transaction?.ref

    // Update transaction in database
    const { data: transaction, error: fetchError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('telr_order_ref', orderRef)
      .single()

    if (fetchError) {
      console.error('Error fetching transaction:', fetchError)
      throw new Error('Transaction not found')
    }

    // Determine final status
    let finalStatus = 'pending'
    if (status?.code === '2' || status?.text === 'Paid') {
      finalStatus = 'completed'
    } else if (status?.code === '3' || status?.text === 'Declined') {
      finalStatus = 'failed'
    } else if (status?.code === '1' || status?.text === 'Cancelled') {
      finalStatus = 'cancelled'
    }

    // Update transaction
    const { error: updateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: finalStatus,
        telr_transaction_ref: transactionRef,
        payment_details: telrData,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      throw updateError
    }

    // If payment successful, grant access to course
    if (finalStatus === 'completed') {
      console.log('Payment successful! Granting access...')
      
      // Here you would:
      // 1. Update user's access codes
      // 2. Send confirmation email
      // 3. Log the access grant
      
      // Example: Grant access by updating user profile or creating access record
      const { error: accessError } = await supabaseClient
        .from('user_access')
        .insert({
          user_id: transaction.user_id,
          granted_at: new Date().toISOString(),
          payment_transaction_id: transaction.id,
          access_type: 'full', // or whatever access level they purchased
          expires_at: null // or set expiry if it's time-limited
        })
      
      if (accessError) {
        console.error('Error granting access:', accessError)
        // Don't fail - payment was successful, handle this async
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        orderRef: orderRef,
        transactionRef: transactionRef
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error verifying Telr payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
