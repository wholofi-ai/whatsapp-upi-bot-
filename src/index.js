import QRCode from "qrcode";

const users = new Map();

function splitAmount(amount) {
  const parts = [];
  while (amount > 1999) {
    parts.push(1999);
    amount -= 1999;
  }
  if (amount > 0) parts.push(amount);
  return parts;
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("WhatsApp UPI Bot Running");
    }

    const { user, text } = await request.json();

    if (text.startsWith("UPI:")) {
      const upi = text.replace("UPI:", "").trim();
      users.set(user, upi);
      return Response.json({ reply: "UPI ID Save Ho Gayi." });
    }

    const amount = Number(text.replace(/[^0-9]/g, ""));
    if (!amount) return Response.json({ reply: "Amount bhejo." });

    const upi = users.get(user);
    if (!upi) {
      return Response.json({ reply: "Pehle UPI: yourname@upi bhejo." });
    }

    const parts = splitAmount(amount);

    const qrList = [];
    for (const p of parts) {
      const link = `upi://pay?pa=${upi}&pn=Payment&am=${p}&cu=INR`;
      const qr = await QRCode.toDataURL(link);
      qrList.push({ amount: p, qr });
    }

    return Response.json({ split: qrList });
  }
};
