// Shared branding for transactional emails sent via Brevo.
// The logo is served from our own domain (frontend/public/email-logo.png) —
// images hosted on the sender's domain help deliverability.
export const EMAIL_LOGO_URL = "https://www.vimarkets.ca/email-logo.png";

export const EMAIL_LOGO_IMG =
  `<img src="${EMAIL_LOGO_URL}" alt="VI Markets Guide" width="200" height="50" ` +
  `style="display: block; margin: 0 auto 20px; width: 200px; max-width: 100%; height: auto; border: 0;">`;
