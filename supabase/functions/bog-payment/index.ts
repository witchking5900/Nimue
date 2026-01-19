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

  // 1. GET REDIRECT (UPDATED WITH DEBUGGER LOGIC)
  if (req.method === 'GET') {
    // Grab the outcome (e.g., 'fail', 'completed') and order_id from the Bank's URL
    const outcome = reqUrl.searchParams.get('outcome') || 'unknown';
    const order_id = reqUrl.searchParams.get('order_id') || '';
    
    // Check if the outcome is in our "Good List"
    const isSuccess = ['success', 'win', 'completed', 'approved'].includes(outcome.toLowerCase());
    
    // ▼▼▼ THE DEBUGGER FIX ▼▼▼
    // Pass the 'reason' and 'order_id' to the frontend pages
    const target = isSuccess 
      ? `${FRONTEND_URL}/payment-success?order_id=${order_id}` 
      : `${FRONTEND_URL}/payment-fail?reason=${outcome}&order_id=${order_id}`;
    
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
        
        // --- CALCULATE DURATION ---
        let expiry = null; 
        
        if (period !== 'lifetime') {
            if (period === '1_minute') {
                expiry = new Date(Date.now() + 60 * 1000).toISOString(); 
            } else {
                let days = 30;
                if (period === '1_week') days = 7;
                if (period === '1_month') days = 30;
                if (period === '6_month') days = 180;
                if (period === '12_month') days = 365;
                
                expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            }
        }

        const newTier = period === 'lifetime' ? 'grand_magus' : 'magus';

        console.log(`Upgrading to ${newTier}, expires: ${expiry ? expiry : 'NEVER (Lifetime)'}`)

        // A. UPDATE PROFILE 
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: { 
            'apikey': SUPABASE_KEY, 
            'Authorization': `Bearer ${SUPABASE_KEY}`, 
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ 
              tier: newTier,
              is_subscribed: true,        
              subscription_end: expiry    
          }) 
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
            tier: newTier,
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

      const authString = btoa(unescape(encodeURIComponent(`${CLIENT_ID}:${CLIENT_SECRET}`)))
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