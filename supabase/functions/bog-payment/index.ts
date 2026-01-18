import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ▼▼▼ KEYS FROM YOUR SCREENSHOT ▼▼▼
const CLIENT_ID = '10000067'
const CLIENT_SECRET = 'In5caljru5lc'

// ▼▼▼ SANDBOX URLs (From your Document) ▼▼▼
// ⚠️ These are different from the Real Bank URLs!
const BOG_AUTH_URL = 'https://oauth2-sandbox.bog.ge/auth/realms/bog/protocol/openid-connect/token'
const BOG_ORDER_URL = 'https://api-sandbox.bog.ge/payments/v1/ecommerce/orders'

// Your website URL
const CALLBACK_URL = 'https://eqrodswdgbdkpjwfnefb.supabase.co/payment/success' 
// We also need a fail URL for the bank to redirect to if it cancels
const FAIL_URL = 'https://eqrodswdgbdkpjwfnefb.supabase.co/payment/fail'

console.log("🚀 BOG Function Started (SANDBOX MODE)")

serve(async (req) => {
  try {
    // 1. CORS Headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', { 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    const { action, amount } = await req.json()

    if (action === 'create_order') {
      console.log(`💳 Processing Sandbox Order: ${amount} GEL`)

      // --- STEP 1: GET TOKEN (FROM SANDBOX) ---
      const authString = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
      
      const tokenResponse = await fetch(BOG_AUTH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })

      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        console.error("❌ Sandbox Auth Failed:", tokenData)
        return new Response(
          JSON.stringify({ error: "Sandbox Auth Failed", details: tokenData }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const accessToken = tokenData.access_token
      console.log("✅ Sandbox Token Received")

      // --- STEP 2: CREATE ORDER (ON SANDBOX) ---
      // The Sandbox API requires a specific structure (Source 245 in your doc)
      const orderResponse = await fetch(BOG_ORDER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'ka'
        },
        body: JSON.stringify({
          callback_url: CALLBACK_URL,
          external_order_id: crypto.randomUUID(),
          purchase_units: {
            currency: "GEL",
            total_amount: amount,
            basket: [
              {
                quantity: 1,
                unit_price: amount,
                product_id: "sub_1",
                description: "Medical Subscription"
              }
            ]
          },
          redirect_urls: {
            fail: FAIL_URL,
            success: CALLBACK_URL
          }
        })
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        console.error("❌ Sandbox Order Failed:", orderData)
        return new Response(
          JSON.stringify({ error: "Order Failed", details: orderData }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      console.log("✅ Order Created:", orderData)

      // Get the redirect link (Source 258 in your doc)
      // It's inside _links -> redirect -> href
      const redirectUrl = orderData._links?.redirect?.href

      if (!redirectUrl) {
         throw new Error("No redirect URL found in Bank response")
      }

      return new Response(
        JSON.stringify({ payment_url: redirectUrl }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400 })

  } catch (error) {
    console.error("🔥 Server Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})