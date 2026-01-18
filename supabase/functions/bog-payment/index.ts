import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ▼▼▼ YOUR LEGACY TEST KEYS ▼▼▼
const CLIENT_ID = '10000067'
const CLIENT_SECRET = 'In5caljru5lc'

// URL to return to after payment
const CALLBACK_URL = 'https://eqrodswdgbdkpjwfnefb.supabase.co/payment/success' 

console.log("🚀 Switching to iPay Legacy System...")

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

    const { action, amount, user_id } = await req.json()

    if (action === 'create_order') {
      console.log(`💳 Creating Order: ${amount} GEL`)

      // --- STEP 1: GET TOKEN (FROM iPAY.GE) ---
      // ⚠️ WE ARE NOT USING oauth2.bog.ge anymore!
      const authString = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
      
      const tokenResponse = await fetch('https://ipay.ge/opay/api/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })

      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        console.error("❌ iPay Auth Failed:", tokenData)
        return new Response(
          JSON.stringify({ error: "iPay Auth Failed", details: tokenData }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const accessToken = tokenData.access_token
      console.log("✅ iPay Token Received")

      // --- STEP 2: CREATE ORDER (ON iPAY.GE) ---
      const orderResponse = await fetch('https://ipay.ge/opay/api/v1/checkout/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          items: [
            {
              amount: String(amount), // iPay requires String for money
              currency: 'GEL',
              description: 'Medical Subscription',
              quantity: 1,
              product_id: 'sub_1'
            }
          ],
          locale: 'ka',
          shop_order_id: crypto.randomUUID(), 
          redirect_url: CALLBACK_URL,
          show_shop_order_id_on_extract: true,
          capture_method: 'AUTOMATIC'
        })
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        console.error("❌ Order Creation Failed:", orderData)
        return new Response(
          JSON.stringify({ error: "Order Failed", details: orderData }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      console.log("✅ Order Created")

      // Find the redirect link in the iPay response
      let redirectUrl = null
      
      // Check different locations where iPay might hide the link
      if (orderData.payment_url) redirectUrl = orderData.payment_url
      if (!redirectUrl && orderData.links) {
          const link = orderData.links.find((l: any) => l.rel === 'approve' || l.method === 'REDIRECT')
          if (link) redirectUrl = link.href
      }
      if (!redirectUrl && orderData._links && orderData._links.redirect) {
          redirectUrl = orderData._links.redirect.href
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