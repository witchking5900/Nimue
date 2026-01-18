import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ▼▼▼ YOUR TEST KEYS ▼▼▼
const CLIENT_ID = '10000067'
const CLIENT_SECRET = 'In5caljru5lc'

// The Payment System URL (For Test Keys, we use the DEV environment)
const BOG_AUTH_URL = 'https://dev.ipay.ge/opay/api/v1/oauth2/token'
const BOG_ORDER_URL = 'https://dev.ipay.ge/opay/api/v1/checkout/orders'

// Your website URL
const CALLBACK_URL = 'https://eqrodswdgbdkpjwfnefb.supabase.co/payment/success' 

console.log("🚀 BOG Function Started (TEST MODE)")

serve(async (req) => {
  try {
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

      // 1. Get Token from TEST Server
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
        console.error("❌ Auth Failed:", tokenData)
        return new Response(
          JSON.stringify({ error: "Bank Auth Failed", details: tokenData }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const accessToken = tokenData.access_token
      console.log("✅ Token Received")

      // 2. Create Order on TEST Server
      const orderResponse = await fetch(BOG_ORDER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          items: [
            {
              amount: String(amount), 
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
        console.error("❌ Order Failed:", orderData)
        return new Response(
          JSON.stringify({ error: "Order Failed", details: orderData }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      console.log("✅ Order Created")

      // Find the link
      let redirectUrl = null
      if (orderData.links) {
        const link = orderData.links.find((l: any) => l.rel === 'approve' || l.method === 'REDIRECT')
        if (link) redirectUrl = link.href
      }
      if (!redirectUrl && orderData._links?.redirect) redirectUrl = orderData._links.redirect.href
      if (!redirectUrl && orderData.payment_url) redirectUrl = orderData.payment_url

      return new Response(
        JSON.stringify({ payment_url: redirectUrl }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400 })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})