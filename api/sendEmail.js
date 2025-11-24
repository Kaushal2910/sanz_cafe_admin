import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { email, name, status, date, time, guests, notes } = req.body;

    if (!email || !status) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const subject =
      status === "accepted"
        ? "Your Sanz Café party request has been accepted!"
        : "Update on your Sanz Café party request";

    const html =
      status === "accepted"
        ? `<p>Hi ${name},</p>
           <p>Your request for ${guests} guests on ${date} at ${time} has been <b>accepted</b>.</p>
           <p>Notes: ${notes}</p>`
        : `<p>Hi ${name},</p>
           <p>Unfortunately, we cannot accept your request for ${guests} guests on ${date} at ${time}.</p>`;

    const info = await transporter.sendMail({
      from: process.env.GMAIL_FROM,
      to: email,
      subject,
      html,
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("Error sending email:", err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ ok: false, error: err.message });
  }
}