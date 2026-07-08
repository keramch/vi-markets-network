import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";

const router = Router();

const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent — please try again later" },
});

// Prevent sender-controlled fields from injecting markup into the HTML email body
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Send a profile contact-form message via Brevo transactional email
router.post("/send", contactRateLimiter, async (req: Request, res: Response) => {
  const { recipientEmail, recipientName, senderName, senderEmail, subject, message } = req.body;

  if (!recipientEmail || !recipientName || !senderName || !senderEmail || !subject || !message) {
    res.status(400).json({
      error: "recipientEmail, recipientName, senderName, senderEmail, subject, and message are required",
    });
    return;
  }

  const safeSenderName = escapeHtml(senderName);
  const safeSenderEmail = escapeHtml(senderEmail);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY ?? "",
      },
      body: JSON.stringify({
        sender: {
          name: "VI Markets Network",
          email: "hello@vimarkets.ca",
        },
        to: [{ email: recipientEmail, name: recipientName }],
        replyTo: { email: senderEmail, name: senderName },
        subject: `New message via VI Markets: ${subject}`,
        htmlContent: `
          <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #EBF5EC;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

              <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_NZl092yuhOixZXKVilPlSQApen9VhuohgXcyHJL7jW2KPDvYncamo_lIyyehxiRG1OrjHWXuT1vGh29GGYgSlT9oxh9DswhP7qhrxBsIFGoDjZcWIAuRs5uFvozB-0HdHQQL4tTLh51jRpRcotbaC1gb-3gT-e27rFTULlgZkCkUQSjhoLPOaV0VUg01Fh2akm9J1tu0JotQHCvkOmG1yx2xVobCtCrahQKWmMPGE7btSIR_rYvwR-ch1oyz_BHeOcKqejx9tPKd-AzwqaGatvGC9GLsDrcucM-BRac6MDSNsWHk_yUMTgDJz9tYg2NcfKB1epL8Txoa4RtK4Du3z_6ys_tq1EULDepgs-VvFvQBF70Aq-O5Zj9c0lyep_pbubRHBLYlTf9GKTGTGOFK4i8a2lLvWT6QlGDW_UreTdkqwwQcFnFtTI8WbsaCqWvEFbSyRMSqKVSpjXfWQawU_haGGkoZ7QV1S6AWbpTz02_A4OwvWyZY_DXHAnyv0N78Z8jeOrWIk9fGHD5cMawXI_fUwOLhtqNj4wjiOSsxwzEkO4WY_iNDhJb4mdJwwgddPDNRAbfmEE2ScjrOQ9CsCqaTqQZ2MfF3l4-PTanhi1WJLMt9x9107yvL2SGRaw=s0-d-e1-ft" alt="VI Markets Network" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                <p style="color: #4A4243; margin: 0; font-size: 14px;">Vancouver Island's Local Market Directory</p>
              </div>

              <h2 style="font-family: 'Rammetto One', Georgia, serif; color: #2E7A72; font-size: 24px; margin: 0 0 20px 0;">You've got a new message!</h2>

              <p style="color: #4A4243; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Someone reached out to you through your VI Markets profile:
              </p>

              <div style="background-color: #EBF5EC; border-radius: 8px; padding: 24px; margin: 0 0 30px 0;">
                <p style="color: #4A4243; font-size: 14px; margin: 0 0 8px 0;"><strong>From:</strong> ${safeSenderName} (${safeSenderEmail})</p>
                <p style="color: #4A4243; font-size: 14px; margin: 0 0 16px 0;"><strong>Subject:</strong> ${safeSubject}</p>
                <p style="color: #4A4243; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-line;">${safeMessage}</p>
              </div>

              <div style="border-top: 2px solid #EBF5EC; padding-top: 30px; margin-top: 40px; text-align: center;">
                <p style="color: #4A4243; font-size: 16px; margin: 0 0 20px 0;">
                  Just reply to this email to respond directly to ${safeSenderName}. 💬
                </p>
                <p style="color: #7B5EA7; font-size: 14px; margin: 0;">
                  Sent via <a href="https://vimarkets.ca" style="color: #2E7A72; text-decoration: none; font-weight: 500;">vimarkets.ca</a>
                </p>
              </div>

            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo contact email error:", response.status, errorBody);
      res.status(500).json({ error: "Failed to send message" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Contact form send error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
