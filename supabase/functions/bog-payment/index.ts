import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ▼▼▼ KEYS & CONFIG ▼▼▼
const CLIENT_ID = '10000067'
const CLIENT_SECRET = 'In5caljru5lc'

const BOG_AUTH_URL = 'https://oauth2-sandbox.bog.ge/auth/realms/bog/protocol/openid-connect/token'
const BOG_ORDER_URL = 'https://api-sandbox.bog.ge/payments/v1/ecommerce/orders'
const SUPABASE_URL = 'https://eqrodswdgbdkpjwfnefb.supabase.co/functions/v1/bog-payment'

// WHERE TO GO (Force Success for Dev Mode)
const TARGET_URL = 'http://localhost:5173?payment=success'

console.log("🚀 BOG Function Started (DYNAMIC PRICE MODE)")

serve(async (req) => {
  // ----------------------------------------------------------------
  // JOB 1: HANDLE BROWSER RETURN (GET REQUEST)
  // ----------------------------------------------------------------
  if (req.method === 'GET') {
    // PURE SERVER-SIDE REDIRECT
    return new Response(null, {
      status: 302, 
      headers: {
        'Location': TARGET_URL,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }

  // ----------------------------------------------------------------
  // JOB 2: HANDLE ORDER CREATION (POST REQUEST)
  // ----------------------------------------------------------------
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    let body = {}
    try { body = await req.json() } catch(e) {}

    // A. HANDLE BANK CALLBACK
    if (body.order_id || body.status || body.event) {
        return new Response("OK", { status: 200 })
    }

    // B. HANDLE ORDER CREATION
    if (body.action === 'create_order') {
      // ▼▼▼ THE FIX: USE THE DYNAMIC AMOUNT FROM FRONTEND ▼▼▼
      const amount = body.amount 
      
      console.log(`💳 Creating Order for: ${amount} GEL`) // Log it to be sure
      
      // 1. Get Token
      const authString = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
      const tokenResponse = await fetch(BOG_AUTH_URL, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials'
      })
      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok) throw new Error("Auth Failed")
      
      // 2. Create Order
      const uniqueId = Date.now()
      
      const orderResponse = await fetch(BOG_ORDER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en'
        },
        body: JSON.stringify({
          callback_url: SUPABASE_URL,
          external_order_id: crypto.randomUUID(),
          purchase_units: {
            currency: "GEL",
            total_amount: amount,
            basket: [{ quantity: 1, unit_price: amount, product_id: "sub_1", description: "Medical Subscription" }]
          },
          capture: "automatic",
          application_type: "web", 
          redirect_urls: {
            fail: `${SUPABASE_URL}?t=${uniqueId}`,
            success: `${SUPABASE_URL}?t=${uniqueId}`
          }
        })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok) throw new Error("Order Failed")

      return new Response(JSON.stringify({ payment_url: orderData._links.redirect.href }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})