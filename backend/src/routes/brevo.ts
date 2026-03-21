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

export default router;
