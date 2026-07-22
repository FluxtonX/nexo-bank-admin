import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Missing email or code" }, { status: 400 });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      // Fallback for local testing if key is missing
      console.log(`[LOCAL DEV] 2FA Code for ${email} is: ${code}`);
      return NextResponse.json({ success: true, localMode: true });
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "CDNTB Security", email: "noreply@cdntbank.com" },
        to: [{ email: email }],
        subject: "Your Admin Verification Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #0F172A;">Admin Verification Required</h2>
            <p style="color: #475569; font-size: 16px;">Hello,</p>
            <p style="color: #475569; font-size: 16px;">A login attempt was made to the CDNTB Admin Panel. Please use the following 6-digit code to complete your sign in:</p>
            <div style="background-color: #F8FAFC; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0A3D91;">${code}</span>
            </div>
            <p style="color: #475569; font-size: 14px;">This code will expire shortly. If you did not initiate this login, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94A3B8; font-size: 12px; text-align: center;">Secure Admin Portal &copy; Canadian National Trust Bank</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Brevo API Error:", errText);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending 2FA code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
