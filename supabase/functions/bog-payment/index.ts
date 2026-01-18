import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ▼▼▼ KEYS & CONFIG ▼▼▼
const CLIENT_ID = Deno.env.get('BOG_CLIENT_ID') || '10000067'
const CLIENT_SECRET = Deno.env.get('BOG_CLIENT_SECRET') || 'In5caljru5lc'

const BOG_AUTH_URL = 'https://oauth2-sandbox.bog.ge/auth/realms/bog/protocol/openid-connect/token'
const BOG_ORDER_URL = 'https://api-sandbox.bog.ge/payments/v1/ecommerce/orders'
// Ensure this matches your Supabase Secret name exactly
const SUPABASE_URL = Deno.env.get('BOG_CALLBACK_URL') || 'https://eqrodswdgbdkpjwfnefb.supabase.co/functions/v1/bog-payment'
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'

console.log("🚀 BOG Function Started (LOGIC RESTORED)")

// Helper function for base64 encoding
function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

serve(async (req) => {
  // ----------------------------------------------------------------
  // JOB 1: HANDLE BROWSER RETURN (GET REQUEST)
  // ----------------------------------------------------------------
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const outcome = url.searchParams.get('outcome')
    
    // 1. Determine where to go based on the URL params
    const isWin = outcome === 'win' || outcome === 'success'
    
    const target = isWin 
      ? `${FRONTEND_URL}?payment=success` 
      : `${FRONTEND_URL}?payment=fail`

    console.log(`🔀 Redirecting to: ${target}`)

    // 2. Perform the Redirect
    return new Response(null, {
      status: 302, 
      headers: {
        'Location': target,
        'Cache-Control': 'no-store, no-cache, must-revalidate', // Kill cache
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
    try { 
      body = await req.json()
    } catch(e) {
      console.error("Failed to parse body:", e)
    }

    // A. HANDLE BANK CALLBACK/WEBHOOK
    if (body.order_id || body.status || body.event || body.type) {
        // TODO: Process payment status update here
        return new Response("OK", { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
    }

    // B. HANDLE ORDER CREATION
    if (body.action === 'create_order') {
      // 1. Force amount to be a Number
      const rawAmount = body.amount || 10
      const amount = Number(rawAmount)
      
      // 2. Get Token
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
      if (!tokenResponse.ok) {
        console.error("Auth Failed:", tokenData)
        throw new Error(`Auth Failed: ${JSON.stringify(tokenData)}`)
      }
      
      // 3. Create Order
      const externalOrderId = crypto.randomUUID()
      
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
        // ▼▼▼ FIX: FORCE CARD METHOD FOR SANDBOX ▼▼▼
        payment_method: ["card"], 
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        
        capture: "automatic",
        application_type: "web", 
        redirect_urls: {
          fail: `${SUPABASE_URL}?outcome=fail&order_id=${externalOrderId}`,
          success: `${SUPABASE_URL}?outcome=success&order_id=${externalOrderId}`
        }
      }
      
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
      
      if (!orderResponse.ok) {
        console.error("Order Creation Failed:", orderData)
        throw new Error(`Order Failed: ${JSON.stringify(orderData)}`)
      }
      
      // Try multiple possible response structures
      let paymentUrl = null
      
      if (orderData._links && orderData._links.redirect && orderData._links.redirect.href) {
        paymentUrl = orderData._links.redirect.href
      }
      else if (orderData.redirect_links && orderData.redirect_links.success) {
        paymentUrl = orderData.redirect_links.success
      }
      else if (orderData.payment_url) {
        paymentUrl = orderData.payment_url
      }
      else if (orderData.redirect_url) {
        paymentUrl = orderData.redirect_url
      }
      
      if (!paymentUrl) {
        console.error("Missing redirect URL in response:", orderData)
        throw new Error(`Order created but no redirect URL found in response`)
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
    console.error("Error in BOG payment function:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message
      }), 
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