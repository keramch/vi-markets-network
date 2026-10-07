import { Router, Request, Response, NextFunction } from "express";
import { EMAIL_LOGO_IMG } from "../utils/emailBranding";
import { db, auth } from "../firebase";

const router = Router();

// Verifies the request carries a valid Firebase ID token belonging to an admin user
async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const token = authHeader.split("Bearer ")[1];

  let decoded: Awaited<ReturnType<typeof auth.verifyIdToken>>;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.isAdmin !== true) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

router.use(adminAuthMiddleware);

// POST /admin/message → send a message to a member via Brevo transactional email
router.post("/message", async (req, res) => {
  const { to, subject, body } = req.body as { to?: string; subject?: string; body?: string };

  if (!to || !subject || !body) {
    return res.status(400).json({ error: "to, subject, and body are required" });
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
          email: "hello@vimarkets.ca",
        },
        to: [{ email: to }],
        subject,
        htmlContent: `
          <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #EBF5EC;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

              <div style="text-align: center; margin-bottom: 40px;">
                ${EMAIL_LOGO_IMG}
                <p style="color: #4A4243; margin: 0; font-size: 14px;">Vancouver Island's Local Market Directory</p>
              </div>

              <h2 style="font-family: 'Rammetto One', Georgia, serif; color: #2E7A72; font-size: 24px; margin: 0 0 20px 0;">${subject}</h2>

              <p style="color: #4A4243; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; white-space: pre-line;">${body}</p>

              <div style="border-top: 2px solid #EBF5EC; padding-top: 30px; margin-top: 40px; text-align: center;">
                <p style="color: #4A4243; font-size: 16px; margin: 0 0 20px 0;">
                  Questions? We're here to help! 💬
                </p>
                <p style="color: #7B5EA7; font-size: 14px; margin: 0;">
                  Reply to this email or visit us at <a href="https://vimarkets.ca" style="color: #2E7A72; text-decoration: none; font-weight: 500;">vimarkets.ca</a>
                </p>
              </div>

            </div>
          </div>
        `,
        textContent: [
          subject,
          "",
          body,
          "",
          "Questions? We're here to help! Reply to this email or visit us at https://www.vimarkets.ca",
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo admin message error:", response.status, errorBody);
      return res.status(500).json({ error: "Failed to send message" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Admin message send error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/members/:type/:id → hard-delete a market/vendor + its owner user
router.delete("/members/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  if (type !== "market" && type !== "vendor") {
    return res.status(400).json({ error: "type must be 'market' or 'vendor'" });
  }

  try {
    const collection = type === "market" ? "markets" : "vendors";
    const ownerField = type === "market" ? "ownedMarketId" : "ownedVendorId";

    // 1. Find the owner's Firestore user document
    const userSnap = await db
      .collection("users")
      .where(ownerField, "==", id)
      .limit(1)
      .get();

    // 2. Delete the market/vendor document
    await db.collection(collection).doc(id).delete();

    if (!userSnap.empty) {
      const userDoc = userSnap.docs[0];
      const userData = userDoc.data();

      // 3. Delete the Firebase Auth account (ignore if already gone)
      if (userData.email) {
        try {
          const authUser = await auth.getUserByEmail(userData.email);
          await auth.deleteUser(authUser.uid);
        } catch (authErr: any) {
          if (authErr.code !== "auth/user-not-found") {
            console.warn(`Could not delete Auth user ${userData.email}:`, authErr.message);
          }
        }
      }

      // 4. Delete the Firestore user document
      await userDoc.ref.delete();
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete member error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
