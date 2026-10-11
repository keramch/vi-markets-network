import { db, auth } from "../firebase";

// ── Member → Brevo list sync ─────────────────────────────────────────────────
// Being on the Brevo list (BREVO_LIST_ID) means "gets the newsletter".
// A member is added only once their email is verified — the verification
// click is their double opt-in:
//   • vendors / organizers always join (Kera's choice)
//   • shoppers (community) join only if they ticked "Email me updates"
// Google sign-ups are verified already, so they're synced at signup.
// `brevoSyncedAt` on the users doc records that it's been done.

type UserDoc = FirebaseFirestore.DocumentData;

// Vendors/organizers are in unless they switched the newsletter off in
// Settings (older docs have no newsletterOptIn field — treated as in).
// Shoppers are in only if they opted in.
export function wantsNewsletter(user: UserDoc): boolean {
  if (user.accountType === "vendor" || user.accountType === "market") return user.newsletterOptIn !== false;
  return user.newsletterOptIn === true;
}

const brevoHeaders = () => ({ "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY ?? "" });

// Adds/updates the member's Brevo contact on the list. Returns true on success.
// Non-fatal: logs and returns false on any problem.
// `explicitOptIn` is only for the person switching the newsletter ON in
// Settings: it also clears an earlier unsubscribe. Automatic syncs never do
// that — someone who unsubscribed must never be quietly re-subscribed.
export async function syncMemberToBrevo(userId: string, options: { explicitOptIn?: boolean } = {}): Promise<boolean> {
  try {
    const brevoListId = parseInt(process.env.BREVO_LIST_ID ?? "");
    if (isNaN(brevoListId)) {
      console.warn("BREVO_LIST_ID not set -- skipping Brevo sync");
      return false;
    }

    const userRef = db.collection("users").doc(userId);
    const user = (await userRef.get()).data();
    if (!user?.email || !wantsNewsletter(user)) return false;

    const accountType = user.accountType as string;
    const attributes: Record<string, string | boolean> = {
      FIRSTNAME: user.firstName ?? "",
      LASTNAME: user.lastName ?? "",
      CITY: user.city ?? "",
      MEMBERTYPE: accountType === "vendor" ? "Vendor" : accountType === "market" ? "Market" : "Community",
      IS_MEMBER: true,
      SUBSCRIPTION_TIER: user.subscription?.tier ?? "free",
      FOUNDING_MEMBER: user.subscription?.foundingMember === true,
    };
    if (user.businessName) attributes.BUSINESSNAME = user.businessName;

    // Current types from the listing itself (they may have been edited since signup)
    if (accountType === "vendor" && user.ownedVendorId) {
      const types = (await db.collection("vendors").doc(user.ownedVendorId).get()).data()?.vendorTypes;
      if (Array.isArray(types) && types.length > 0) attributes.VENDOR_TYPES = types.join("|");
    }
    if (accountType === "market" && user.ownedMarketId) {
      const types = (await db.collection("markets").doc(user.ownedMarketId).get()).data()?.marketTypes;
      if (Array.isArray(types) && types.length > 0) attributes.MARKET_TYPES = types.join("|");
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: brevoHeaders(),
      body: JSON.stringify({
        email: user.email,
        attributes,
        listIds: [brevoListId],
        updateEnabled: true,
        ...(options.explicitOptIn ? { emailBlacklisted: false } : {}),
      }),
    });
    if (!response.ok) {
      console.error("Brevo member sync error:", response.status, await response.text());
      return false;
    }

    await userRef.update({ brevoSyncedAt: Date.now() });
    return true;
  } catch (err) {
    console.error("Brevo member sync failed (non-fatal):", err);
    return false;
  }
}

// Syncs the member if Firebase says their email is verified and they haven't
// been synced yet. Safe to call repeatedly.
export async function syncMemberIfVerified(userId: string): Promise<boolean> {
  try {
    const user = (await db.collection("users").doc(userId).get()).data();
    if (!user || user.brevoSyncedAt || !wantsNewsletter(user)) return false;
    const authUser = await auth.getUser(userId);
    if (!authUser.emailVerified) return false;
    return await syncMemberToBrevo(userId);
  } catch (err) {
    console.error("Brevo verified-sync check failed (non-fatal):", err);
    return false;
  }
}

// Is this email actually receiving the newsletter right now? Asks Brevo, so it
// reflects unsubscribes made through an email's unsubscribe link too.
export async function getNewsletterStatus(email: string): Promise<boolean> {
  const brevoListId = parseInt(process.env.BREVO_LIST_ID ?? "");
  const response = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    headers: brevoHeaders(),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Brevo contact lookup failed: ${response.status}`);
  const contact = await response.json() as { emailBlacklisted?: boolean; listIds?: number[] };
  return !contact.emailBlacklisted && (contact.listIds ?? []).includes(brevoListId);
}

// Takes the member off the newsletter list (they stay a Brevo contact, so
// account-related details like plan and renewal date are kept).
export async function removeMemberFromNewsletter(email: string): Promise<boolean> {
  const brevoListId = parseInt(process.env.BREVO_LIST_ID ?? "");
  if (isNaN(brevoListId)) return false;
  const response = await fetch(`https://api.brevo.com/v3/contacts/lists/${brevoListId}/contacts/remove`, {
    method: "POST",
    headers: brevoHeaders(),
    body: JSON.stringify({ emails: [email] }),
  });
  // 400 here usually means "not on the list" — already the result we want
  if (!response.ok && response.status !== 400) {
    console.error("Brevo list removal error:", response.status, await response.text());
    return false;
  }
  return true;
}
