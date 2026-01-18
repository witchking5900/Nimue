// supabase/functions/bog-payment/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Setup Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

// CORS Headers (Allows your React website to talk to this function)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, amount, user_id } = await req.json()

    // --- STEP 1: GET BANK ACCESS TOKEN (Docs Page 1) ---
    // We log in to the bank using your Secrets
    const clientId = Deno.env.get('BOG_CLIENT_ID')
    const clientSecret = Deno.env.get('BOG_SECRET')
    const appDomain = Deno.env.get('APP_DOMAIN') // https://nimue.ge

    // Encode credentials for Basic Auth
    const basicAuth = btoa(`${clientId}:${clientSecret}`)

    const authResponse = await fetch('https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    const authData = await authResponse.json()
    if (!authResponse.ok) throw new Error(`Bank Auth Failed: ${JSON.stringify(authData)}`)
    
    const bankToken = authData.access_token

    // --- STEP 2: CREATE ORDER (Docs Page 2) ---
    if (action === 'create_order') {
      
      // 2a. Tell Bank we want to create an order
      const orderResponse = await fetch('https://api.bog.ge/payments/v1/ecommerce/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bankToken}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Accept-Language': 'ka'
        },
        body: JSON.stringify({
          callback_url: `${supabaseUrl}/functions/v1/bog-payment-callback`, // We will build this next
          redirect_url: `${appDomain}/payment/success`, // Where user goes after paying
          purchase_units: [
            {
              amount: {
                currency_code: 'GEL',
                value: amount.toString() // e.g. "5.00"
              }
            }
          ]
        })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(`Order Failed: ${JSON.stringify(orderData)}`)

      // 2b. Save "Pending" Receipt in Database
      // We save the 'id' (Order ID) so we can check it later
      const { error: dbError } = await supabase
        .from('payments')
        .insert({
          user_id: user_id,
          amount: amount,
          status: 'pending',
          bog_order_id: orderData.id 
        })
      
      if (dbError) throw new Error(`DB Error: ${dbError.message}`)

      // 2c. Send the "Redirect Link" back to your React App
      // Your website will open this link to show the Bank page
      return new Response(JSON.stringify({ 
        payment_url: orderData._links.redirect.href 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})