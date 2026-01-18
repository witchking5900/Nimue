import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ▼▼▼ KEYS FROM YOUR SCREENSHOT ▼▼▼
const CLIENT_ID = '10000067'
const CLIENT_SECRET = 'In5caljru5lc'
const CALLBACK_URL = 'https://eqrodswdgbdkpjwfnefb.supabase.co/payment/success' 

console.log("🚀 BOG UNIVERSAL LOADER - VERSION 777") 

serve(async (req) => {
  try {
    // CORS Headers
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
      console.log(`💳 Processing Order: ${amount} GEL`)
      
      const authString = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
      let accessToken = null
      let usedUrl = ''

      // ---------------------------------------------------------
      // ATTEMPT 1: TRY THE DEV SERVER (dev.ipay.ge)
      // ---------------------------------------------------------
      console.log("🔸 Attempt 1: Trying DEV Server...")
      try {
        const devToken = await fetch('https://dev.ipay.ge/opay/api/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        })
        const devData = await devToken.json()
        if (devToken.ok && devData.access_token) {
            accessToken = devData.access_token
            usedUrl = 'https://dev.ipay.ge/opay/api/v1/checkout/orders'
            console.log("✅ SUCCESS on DEV Server!")
        }
      } catch (e) { console.log("Dev Server failed or unreachable") }

      // ---------------------------------------------------------
      // ATTEMPT 2: TRY THE PROD SERVER (ipay.ge)
      // ---------------------------------------------------------
      if (!accessToken) {
        console.log("🔸 Attempt 2: Trying PROD Server...")
        try {
            const prodToken = await fetch('https://ipay.ge/opay/api/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
            })
            const prodData = await prodToken.json()
            if (prodToken.ok && prodData.access_token) {
                accessToken = prodData.access_token
                usedUrl = 'https://ipay.ge/opay/api/v1/checkout/orders'
                console.log("✅ SUCCESS on PROD Server!")
            } else {
                // If both fail, return the error from PROD
                console.error("❌ PROD Auth also failed:", prodData)
                return new Response(
                    JSON.stringify({ error: "Auth Failed on ALL servers. Check Keys.", details: prodData }),
                    { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
                )
            }
        } catch (e) { console.log("Prod Server failed") }
      }

      if (!accessToken) throw new Error("Could not connect to Bank API")

      // ---------------------------------------------------------
      // STEP 3: CREATE ORDER (Using the working URL)
      // ---------------------------------------------------------
      const orderResponse = await fetch(usedUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          items: [{
              amount: String(amount), 
              currency: 'GEL',
              description: 'Medical Subscription',
              quantity: 1,
              product_id: 'sub_1'
          }],
          locale: 'ka',
          shop_order_id: crypto.randomUUID(), 
          redirect_url: CALLBACK_URL,
          show_shop_order_id_on_extract: true,
          capture_method: 'AUTOMATIC'
        })
      })

      const orderData = await orderResponse.json()
      
      // Find Redirect Link
      let redirectUrl = orderData.payment_url || null
      if (!redirectUrl && orderData.links) {
        const link = orderData.links.find((l: any) => l.rel === 'approve' || l.method === 'REDIRECT')
        if (link) redirectUrl = link.href
      }
      if (!redirectUrl && orderData._links?.redirect) redirectUrl = orderData._links.redirect.href

      return new Response(
        JSON.stringify({ payment_url: redirectUrl }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})