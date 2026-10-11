// ── Checking addresses members type in ───────────────────────────────────────
// Links and image addresses saved on profiles/events are shown to every
// visitor, so only accept ordinary web addresses — never javascript:, data:,
// file: etc. (React also blocks javascript: links when displaying them; this
// is the second layer.)

// True for http(s) URLs. With allowBareDomain, also accepts "mysite.ca" or
// "www.mysite.ca/shop" (the profile page adds https:// itself).
export function isSafeWebUrl(value: unknown, options: { allowBareDomain?: boolean; httpsOnly?: boolean } = {}): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return true; // empty = cleared, that's fine
  if (trimmed.length > 2000) return false;

  if (options.allowBareDomain && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    // No scheme at all: must look like a domain name
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(trimmed);
  }

  try {
    const url = new URL(trimmed);
    return options.httpsOnly ? url.protocol === "https:" : url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// Checks the address fields of a market/vendor update. Returns an error
// message for the first bad one, or null if everything is fine.
export function checkListingUrls(updates: Record<string, any>): string | null {
  for (const field of ["logoUrl", "headerPhotoUrl"]) {
    if (field in updates && updates[field] != null && !isSafeWebUrl(updates[field], { httpsOnly: true })) {
      return `That image address isn't valid (${field}).`;
    }
  }
  if (Array.isArray(updates.photos) && updates.photos.some((p: unknown) => !isSafeWebUrl(p, { httpsOnly: true }))) {
    return "One of the photo addresses isn't valid.";
  }
  const website = updates.contact?.socials?.website;
  if (website != null && !isSafeWebUrl(website, { allowBareDomain: true })) {
    return "Please enter a normal website address, like https://mysite.ca";
  }
  return null;
}
