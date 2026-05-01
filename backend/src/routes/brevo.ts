import { Router, Request, Response } from "express";

const router = Router();

router.post("/subscribe", async (req: Request, res: Response) => {
  const { email, firstName, city } = req.body;

  if (!email || !firstName) {
    res.status(400).json({ error: "email and firstName are required" });
    return;
  }

  const listId = parseInt(process.env.BREVO_LIST_ID ?? "");
  if (isNaN(listId)) {
    console.error("BREVO_LIST_ID is not set or invalid");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY ?? "",
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName, CITY: city ?? "" },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo API error:", response.status, errorBody);
      res.status(500).json({ error: "Failed to subscribe contact" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Brevo subscribe error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send custom verification email
router.post("/send-verification", async (req: Request, res: Response) => {
  const { email, firstName, verificationUrl } = req.body;

  if (!email || !firstName || !verificationUrl) {
    res.status(400).json({ error: "email, firstName, and verificationUrl are required" });
    return;
  }

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
          email: "hello@vimarkets.ca"
        },
        to: [{ email, name: firstName }],
        subject: "Please verify your VI Markets account",
        htmlContent: `
          <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #EBF5EC;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

              <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_NZl092yuhOixZXKVilPlSQApen9VhuohgXcyHJL7jW2KPDvYncamo_lIyyehxiRG1OrjHWXuT1vGh29GGYgSlT9oxh9DswhP7qhrxBsIFGoDjZcWIAuRs5uFvozB-0HdHQQL4tTLh51jRpRcotbaC1gb-3gT-e27rFTULlgZkCkUQSjhoLPOaV0VUg01Fh2akm9J1tu0JotQHCvkOmG1yx2xVobCtCrahQKWmMPGE7btSIR_rYvwR-ch1oyz_BHeOcKqejx9tPKd-AzwqaGatvGC9GLsDrcucM-BRac6MDSNsWHk_yUMTgDJz9tYg2NcfKB1epL8Txoa4RtK4Du3z_6ys_tq1EULDepgs-VvFvQBF70Aq-O5Zj9c0lyep_pbubRHBLYlTf9GKTGTGOFK4i8a2lLvWT6QlGDW_UreTdkqwwQcFnFtTI8WbsaCqWvEFbSyRMSqKVSpjXfWQawU_haGGkoZ7QV1S6AWbpTz02_A4OwvWyZY_DXHAnyv0N78Z8jeOrWIk9fGHD5cMawXI_fUwOLhtqNj4wjiOSsxwzEkO4WY_iNDhJb4mdJwwgddPDNRAbfmEE2ScjrOQ9CsCqaTqQZ2MfF3l4-PTanhi1WJLMt9x9107yvL2SGRaw=s0-d-e1-ft" alt="VI Markets Network" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                <p style="color: #4A4243; margin: 0; font-size: 14px;">Vancouver Island's Local Market Directory</p>
              </div>

              <h2 style="font-family: 'Rammetto One', Georgia, serif; color: #2E7A72; font-size: 24px; margin: 0 0 20px 0;">Welcome, ${firstName}!</h2>

              <p style="color: #4A4243; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're thrilled to have you join our community connecting shoppers, vendors, and organizers across Vancouver Island! 🎉
              </p>

              <p style="color: #4A4243; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                To get started and unlock your full VI Markets experience, please verify your email address:
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" style="background: linear-gradient(135deg, #2E7A72 0%, #9DD4CF 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(46, 122, 114, 0.3);">
                  ✨ Verify My Email ✨
                </a>
              </div>

              <div style="background-color: #EBF5EC; border-left: 4px solid #2E7A72; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
                <p style="color: #4A4243; font-size: 14px; line-height: 1.5; margin: 0;">
                  <strong>Having trouble with the button?</strong> Copy and paste this link into your browser:
                </p>
                <p style="color: #2E7A72; word-break: break-all; font-size: 13px; margin: 10px 0 0 0; font-family: monospace;">
                  ${verificationUrl}
                </p>
              </div>

              <div style="border-top: 2px solid #EBF5EC; padding-top: 30px; margin-top: 40px; text-align: center;">
                <p style="color: #4A4243; font-size: 16px; margin: 0 0 20px 0;">
                  Questions? We're here to help! 💬
                </p>
                <p style="color: #7B5EA7; font-size: 14px; margin: 0;">
                  Reply to this email or visit us at <a href="https://vimarkets.ca" style="color: #2E7A72; text-decoration: none; font-weight: 500;">vimarkets.ca</a>
                </p>
              </div>

            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #4A4243; font-size: 12px; opacity: 0.7;">
                If you didn't create an account with VI Markets Network, you can safely ignore this email.
              </p>
            </div>
          </div>
        `
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo verification email error:", response.status, errorBody);
      res.status(500).json({ error: "Failed to send verification email" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Brevo verification email error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
