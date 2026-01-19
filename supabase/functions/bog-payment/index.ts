import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const CLIENT_ID = Deno.env.get('BOG_CLIENT_ID') || '10000067'
  const CLIENT_SECRET = Deno.env.get('BOG_CLIENT_SECRET') || 'In5caljru5lc'
  const BOG_AUTH_URL = 'https://oauth2-sandbox.bog.ge/auth/realms/bog/protocol/openid-connect/token'
  const BOG_ORDER_URL = 'https://api-sandbox.bog.ge/payments/v1/ecommerce/orders'
  const CALLBACK_URL = Deno.env.get('BOG_CALLBACK_URL') || 'https://eqrodswdgbdkpjwfnefb.supabase.co/functions/v1/bog-payment'
  const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  const reqUrl = new URL(req.url)

  // 1. GET REDIRECT
  if (req.method === 'GET') {
    const outcome = reqUrl.searchParams.get('outcome')
    const target = `${FRONTEND_URL}?payment=${outcome === 'success' || outcome === 'win' ? 'success' : 'fail'}`
    return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': target } })
  }

  try {
    let body = {}
    try { body = await req.json() } catch(e) {
      console.error("Failed to parse JSON body:", e)
    }

    // 2. WEBHOOK (POST) - UPDATE DB
    if (body.order_id || body.status || body.event) {
      console.log("=== WEBHOOK RECEIVED ===")
      
      const webhookBody = body.body || body
      const status = webhookBody.order_status?.key || body.order_status?.key || body.status
      const userId = reqUrl.searchParams.get('user_id')
      const period = reqUrl.searchParams.get('period') || '1_month'

      console.log(`Status: ${status}, UserId: ${userId}, Period: ${period}`)

      if (status === 'completed' && userId && SUPABASE_URL && SUPABASE_KEY) {
        console.log("✅ Payment completed, upgrading user...")
        
        // --- CALCULATE DURATION (UPDATED) ---
        let expiry;
        
        // Special 1 Minute Test Case
        if (period === '1_minute') {
            expiry = new Date(Date.now() + 60 * 1000).toISOString() // Exact 60 seconds
        } else {
            // Standard Logic
            let days = 30
            if (period === '1_week') days = 7
            if (period === '1_month') days = 30
            if (period === '6_month') days = 180
            if (period === '12_month') days = 365
            if (period === 'lifetime') days = 36500 // 100 Years
            
            expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        }

        const newTier = period === 'lifetime' ? 'archmage' : 'magus'

        console.log(`Upgrading to ${newTier}, expires: ${expiry}`)

        // A. UPDATE PROFILE
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: { 
            'apikey': SUPABASE_KEY, 
            'Authorization': `Bearer ${SUPABASE_KEY}`, 
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ tier: 'magus' }) // Always Magus for safety, let DB handle Archmage if needed
        })
        
        // B. UPSERT SUBSCRIPTION
        await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: { 
            'apikey': SUPABASE_KEY, 
            'Authorization': `Bearer ${SUPABASE_KEY}`, 
            'Content-Type': 'application/json',
            'Prefer': 'return=representation,resolution=merge-duplicates'
          },
          body: JSON.stringify({ 
            user_id: userId, 
            status: 'active', 
            tier: 'magus',
            plan_id: period,
            current_period_start: new Date().toISOString(),
            current_period_end: expiry,
            updated_at: new Date().toISOString()
          })
        })

        console.log("=== WEBHOOK PROCESSING COMPLETE ===")
      }
      
      return new Response("OK", { status: 200, headers: corsHeaders })
    }

    // 3. CREATE ORDER (POST)
    if (body.action === 'create_order') {
      console.log("=== CREATE ORDER REQUEST ===")
      const amount = Number(body.amount || 10)
      const userId = body.user_id || 'unknown'
      const period = body.period || '1_month'

      console.log(`Amount: ${amount} GEL, User: ${userId}, Period: ${period}`)

      // Auth
      const authString = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
      const tokenResp = await fetch(BOG_AUTH_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Basic ${authString}`, 
          'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: 'grant_type=client_credentials'
      })
      
      if (!tokenResp.ok) {
        const errText = await tokenResp.text()
        return new Response(JSON.stringify({ error: `Auth failed: ${errText}` }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
      
      const tokenData = await tokenResp.json()

      // Order
      const externalId = crypto.randomUUID()
      const smartCallbackUrl = `${CALLBACK_URL}?user_id=${userId}&period=${period}`
      
      const payload = {
        callback_url: smartCallbackUrl,
        external_order_id: externalId,
        purchase_units: { 
          currency: "GEL", 
          total_amount: amount, 
          basket: [{ 
            quantity: 1, 
            unit_price: amount, 
            product_id: `sub_${period}`, 
            description: `Subscription: ${period}` 
          }] 
        },
        payment_method: ["card"],
        capture: "automatic",
        redirect_urls: {
          fail: `${CALLBACK_URL}?outcome=fail&order_id=${externalId}`,
          success: `${CALLBACK_URL}?outcome=success&order_id=${externalId}`
        }
      }

      const orderResp = await fetch(BOG_ORDER_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${tokenData.access_token}`, 
          'Content-Type': 'application/json', 
          'Accept-Language': 'en' 
        },
        body: JSON.stringify(payload)
      })
      
      const orderData = await orderResp.json()
      
      if (!orderResp.ok) {
        return new Response(JSON.stringify({ error: `Order failed: ${JSON.stringify(orderData)}` }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const link = orderData._links?.redirect?.href || orderData.redirect_links?.success || orderData.payment_url

      if (!link) {
        return new Response(JSON.stringify({ error: "No payment link found" }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({ payment_url: link }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("💥 Server error:", error)
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})