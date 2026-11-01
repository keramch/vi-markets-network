# Security

Read this before adding or changing a backend route, a form that sends email, or anything that saves an address. The everyday rules are in `CLAUDE.md`. This file holds the detail and the reasons.

## Why every route checks the caller

A Sept 29, 2026 audit found that almost every backend route accepted requests from anyone, because the Admin SDK skips the rules files. Anyone could have made themselves admin, downloaded every member's record, sent phishing email from hello@vimarkets.ca, or edited any listing. No sign any of it was used. It was fixed in 5 steps and checked from outside and with a logged-in second member. A re-audit on Oct 10, 2026 covered everything added since.

## What each area enforces

- **Users:** members edit only their own doc and only safe fields (`SELF_EDITABLE_USER_FIELDS` in `routes/users.ts`). `GET /users` is admin-only and only fetched by the frontend for admins. `GET /auth/me` uses the token; the `?email=` param is ignored. `/register` returns 409, not the existing record, for a duplicate email.
- **Founding-member badge:** `GET /markets` and `GET /vendors` include a computed `ownerFoundingMember` (never stored), so profile pages don't need the member list.
- **Markets and vendors:** owner or admin only. For non-admins, the profile editor's full-object save has `ownerId`, `status`, `isFeatured`, `featuredUntil`, `impressionCount`, `joinDate`, `slug` and `reviews` silently dropped (`sanitizeListingUpdate` in `utils/listingAccess.ts`). So Featured must be set server-side, by the Stripe webhook or admin.
- **Events:** create, edit and archive by the market owner, the event's organizer, or admin. Drafts, cancelled and archived events are visible only to them.
- **Email:** the verification email goes only to the signed-in caller, with the link built server-side. The contact form sends only to a listed market or vendor's contact email.
- **Reviews:** author and userId come from the account, rating is 1 to 5, approve and decline are admin-only.
- **Follows:** self-only.
- **Applications:** visible only to the vendor and the receiving market.
- **Phase 2 routes** (`marketApplications`, `vendorApplications`, `organizerAccounts`): admin-only until their UI and permissions are built. They still use create-on-edit `set(merge)`, so fix that at the same time.
- **Stripe checkout** upgrades the token's uid, never a uid from the body.

## Limits and spam

- **Rate limits:** 120 writes / 15 min / IP globally (`index.ts`; GETs and the Stripe webhook are exempt). 10 account creations / hour / IP on `/users/register` and `/users/register-oauth`. 5 / hour / IP on `/brevo/subscribe`, verification and the contact form. `trust proxy` is set so limits are per visitor.
- **Spam guard:** the contact form, footer newsletter signup and account signup carry a hidden honeypot field and a time-to-submit check (`frontend/components/SpamGuard.tsx` → `backend/src/middleware/spamGuard.ts`). Bots get a fake success (contact, subscribe) or a generic error (register), nothing is sent or saved, and each block is logged in Render as "Spam guard blocked …".
- Kera chose this over reCAPTCHA (friction, accessibility, Google tracking). If spam still gets through, add Cloudflare Turnstile, not reCAPTCHA.

## Saved addresses and headers

- **Saved addresses** (`utils/urlSafety.ts`): listing logo, header and photos must be https. Website is http(s) or a bare domain. Event `externalEventUrl` is http(s).
- **Backend headers:** hides `x-powered-by`, sets nosniff.
- **`frontend/vercel.json` headers:** X-Frame-Options SAMEORIGIN, CSP `frame-ancestors 'self'`, nosniff, Referrer-Policy, Permissions-Policy (geolocation self).
- **Do NOT add Cross-Origin-Opener-Policy.** It breaks the Google sign-in popup.
- **CORS** is limited to vimarkets.ca, this project's Vercel previews and localhost.
- **Firebase browser API key** is restricted in Google Cloud Console to `*.vimarkets.ca/*`, `vimarkets.ca/*`, the stable dev preview URL and `vi-markets-fa746.firebaseapp.com/*`. Per-build Vercel URLs can't log in.

## Known and accepted

- Frontend Firebase SDK advisories are in Firestore and grpc code the site doesn't use.
- An owner can point their listing's contact email at someone else. Low risk, because the contact form is limited to 5/hour/IP.
- Contact emails are public in `GET /markets` and `GET /vendors`.
