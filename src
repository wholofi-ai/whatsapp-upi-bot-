import QRCode from "qrcode";

// Amount ko 1999 ke hisso me split karne ka function
function splitAmount(amount) {
  const parts = [];
  while (amount > 1999) {
    parts.push(1999);
    amount -= 1999;
  }
  if (amount > 0) parts.push(amount);
  return parts;
}

// WhatsApp par text message bhejne ka function
async function sendWhatsAppMessage(phoneNumberId, token, to, text) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: text }
    })
  });
}

// WhatsApp par QR Image bhejne ka function
async function sendWhatsAppImage(phoneNumberId, token, to, imageUrl, caption) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "image",
      image: { link: imageUrl, caption: caption }
    })
  });
}

export default {
  async fetch(request, env, ctx) {
    
    // 1. Webhook Verification (Meta isko check karne ke liye GET request bhejta hai)
    if (request.method === "GET") {
      const url = new URL(request.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      // Token aur mode match hona chahiye
      if (mode === "subscribe" && token === env.VERIFY_TOKEN) {
        
        // YEH HAI SABSE BADA FIX: Challenge ko seedha plain text me return karo
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" }
        });
        
      }
      return new Response("Forbidden", { status: 403 });
    }

    // 2. Incoming Messages (POST request)
    if (request.method === "POST") {
      try {
        const body = await request.json();
        
        if (body.object === "whatsapp_business_account") {
          const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
          
          if (message) {
            const from = message.from; // User ka WhatsApp number
            const msgBody = message.text?.body || "";
            
            // Dhyan rahe: Yahan 'UPI_USERS' aapke KV binding ka naam hai
            // Agar aapne binding name 'KV' rakha hai, toh env.KV likhein
            const kvStore = env.UPI_USERS || env.KV; 

            // Check karo user ne kya bheja
            if (msgBody.startsWith("UPI:")) {
              const upi = msgBody.replace("UPI:", "").trim();
              await kvStore.put(from, upi);
              await sendWhatsAppMessage(env.PHONE_NUMBER_ID, env.WHATSAPP_TOKEN, from, "✅ UPI ID Save Ho Gayi. Ab amount bhejo.");
            } else {
              const amount = Number(msgBody.replace(/[^0-9]/g, ""));
              if (!amount) {
                await sendWhatsAppMessage(env.PHONE_NUMBER_ID, env.WHATSAPP_TOKEN, from, "Kripya sahi amount bhejein ya 'UPI: yourname@upi' format me UPI ID save karein.");
              } else {
                const upi = await kvStore.get(from);
                if (!upi) {
                  await sendWhatsAppMessage(env.PHONE_NUMBER_ID, env.WHATSAPP_TOKEN, from, "Pehle apni UPI ID save karein. Format: UPI: yourname@upi");
                } else {
                  const parts = splitAmount(amount);
                  await sendWhatsAppMessage(env.PHONE_NUMBER_ID, env.WHATSAPP_TOKEN, from, `Aapka ₹${amount} ka payment ${parts.length} hisson mein split kiya gaya hai.`);
                  
                  for (const p of parts) {
                    const upiLink = `upi://pay?pa=${upi}&pn=Payment&am=${p}&cu=INR`;
                    // Free QR API ka use karke image ka link bana rahe hain
                    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
                    
                    await sendWhatsAppImage(
                      env.PHONE_NUMBER_ID, 
                      env.WHATSAPP_TOKEN, 
                      from, 
                      qrImageUrl, 
                      `💰 Amount: ₹${p}`
                    );
                  }
                }
              }
            }
          }
          return new Response("EVENT_RECEIVED", { status: 200 });
        }
        return new Response("Not Found", { status: 404 });
      } catch (error) {
        return new Response("Error processing webhook", { status: 500 });
      }
    }

    return new Response("WhatsApp UPI Bot is Running", { status: 200 });
  }
};
