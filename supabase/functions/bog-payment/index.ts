import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CLIENT_ID = Deno.env.get('BOG_CLIENT_ID')
const CLIENT_SECRET = Deno.env.get('BOG_CLIENT_SECRET')
const BOG_AUTH_URL = 'https://oauth2-sandbox.bog.ge/auth/realms/bog/protocol/openid-connect/token'
const BOG_ORDER_URL = 'https://api-sandbox.bog.ge/payments/v1/ecommerce/orders'
const SUPABASE_URL = Deno.env.get('BOG_CALLBACK_URL')
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'

console.log("--------------- NEW REQUEST ---------------")
console.log("Config Check:", { 
  hasClientId: !!CLIENT_ID, 
  hasSecret: !!CLIENT_SECRET, 
  callbackUrl: SUPABASE_URL 
})

function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

serve(async (req) => {
  // 1. HANDLE REDIRECTS (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const outcome = url.searchParams.get('outcome')
    const orderId = url.searchParams.get('order_id')
    
    console.log(`🔀 Redirecting User. Outcome: ${outcome}, OrderID: ${orderId}`)
    
    const isWin = outcome === 'win' || outcome === 'success'
    const target = isWin ? `${FRONTEND_URL}?payment=success` : `${FRONTEND_URL}?payment=fail`
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': target,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  }

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    let body = {}
    try {
      body = await req.json()
      console.log("📥 Request Body Received:", JSON.stringify(body))
    } catch(e) {
      console.error("❌ Body parse error", e)
    }

    // 2. CREATE ORDER (POST)
    if (body.action === 'create_order') {
      console.log("🔹 Action: Create Order")
      
      const amount = Number(body.amount || 10)
      console.log(`🔹 Amount: ${amount}`)

      // A. Get Token
      console.log("🔹 Step 1: Requesting Auth Token...")
      const authString = base64Encode(`${CLIENT_ID}:${CLIENT_SECRET}`)
      
      const tokenResponse = await fetch(BOG_AUTH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })

      const tokenData = await tokenResponse.json()
      console.log("🔹 Auth Response Status:", tokenResponse.status)
      
      if (!tokenResponse.ok) {
        console.error("❌ Auth Failed Response:", tokenData)
        throw new Error(`Auth Failed: ${JSON.stringify(tokenData)}`)
      }
      console.log("✅ Auth Token Received")

      // B. Send Order
      const externalOrderId = crypto.randomUUID()
      console.log(`🔹 Generated External ID: ${externalOrderId}`)

      const orderPayload = {
        callback_url: SUPABASE_URL,
        external_order_id: externalOrderId,
        purchase_units: {
          currency: "GEL",
          total_amount: amount,
          basket: [{
            quantity: 1,
            unit_price: amount,
            product_id: "sub_1",
            description: "Medical Subscription"
          }]
        },
        // CRITICAL FIX: Explicitly set card for sandbox
        payment_method: ["card"],
        capture: "automatic",
        redirect_urls: {
          fail: `${SUPABASE_URL}?outcome=fail&order_id=${externalOrderId}`,
          success: `${SUPABASE_URL}?outcome=success&order_id=${externalOrderId}`
        }
      }

      console.log("🔹 Step 2: Sending Order Payload to BOG:", JSON.stringify(orderPayload))

      const orderResponse = await fetch(BOG_ORDER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en'
        },
        body: JSON.stringify(orderPayload)
      })

      const orderData = await orderResponse.json()
      console.log("🔹 Order Response Status:", orderResponse.status)
      console.log("🔹 Order Response Body:", JSON.stringify(orderData))

      if (!orderResponse.ok) {
        console.error("❌ Order Creation Failed:", orderData)
        throw new Error(`Order Failed: ${JSON.stringify(orderData)}`)
      }

      // C. Extract Link
      let paymentUrl = null
      if (orderData._links?.redirect?.href) paymentUrl = orderData._links.redirect.href
      else if (orderData.redirect_links?.success) paymentUrl = orderData.redirect_links.success
      else if (orderData.payment_url) paymentUrl = orderData.payment_url
      else if (orderData.redirect_url) paymentUrl = orderData.redirect_url

      console.log(`✅ Payment URL Found: ${paymentUrl}`)

      if (!paymentUrl) {
        throw new Error(`Order created but no URL found: ${JSON.stringify(orderData)}`)
      }

      return new Response(
        JSON.stringify({
          payment_url: paymentUrl,
          order_id: externalOrderId
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400 })

  } catch (error) {
    console.error("❌ CRITICAL FUNCTION ERROR:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})