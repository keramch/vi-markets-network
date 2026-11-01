# Email and Brevo

Read this before changing anything that sends email or syncs contacts.

## Brevo setup

- Attributes must be **Text type**. Multi-select attributes silently reject API values.
- Multi-value fields are **pipe-delimited strings** (e.g. `"Farm|Artisan"`). Segment in Brevo with a "contains" filter.
- The frontend sends market types under the key `marketCategories`, not `marketTypes`.
- System mail address: `hello@vimarkets.ca`.
- Attributes in use: `FIRSTNAME`, `LASTNAME`, `BUSINESSNAME`, `CITY`, `MEMBERTYPE`, `IS_MEMBER`, `SUBSCRIPTION_TIER`, `FOUNDING_MEMBER`, `VENDOR_CATEGORIES`, `MARKET_CATEGORIES`.
- `termEnds` dates sync to Brevo in `MM/DD/YYYY` format with slashes, not ISO 8601.
- One list (`BREVO_LIST_ID`) is the newsletter audience, sliced with segments by MEMBERTYPE and types. Kera chose this over separate lists.

## Who gets added to the list

- **Member sync waits for email verification.** The verification click doubles as the newsletter double opt-in (`backend/src/utils/brevoSync.ts`).
- Vendors and organizers join once verified. Shoppers join only if they ticked "Email me updates", which is **unticked by default** (CASL: no pre-ticked consent).
- Consent is stored as `newsletterOptIn` on the users doc. `brevoSyncedAt` marks the sync as done.
- The sync is triggered by `POST /users/email-verified`, which the site calls after `applyActionCode` and which checks with Firebase that the email is really verified. `GET /auth/me` is the backup on next login.
- Google sign-ups sync at signup.
- Until a member is synced, the Stripe webhook's and the type-sync's Brevo PUTs fail. This is logged and non-fatal, and the later sync sends current tier and types anyway.

## Footer newsletter signup

- `/brevo/subscribe` calls Brevo's `contacts/doubleOptinConfirmation` with template **6** (override with `BREVO_DOI_TEMPLATE_ID`).
- Contacts join `BREVO_LIST_ID` only after clicking the link, which lands on `/?subscribed=true`.
- **Brevo gotcha:** a double opt-in template used through the API must be Active, contain the `{{ doubleoptin }}` link, AND have the tag `optin` (template → Show advanced settings → Tag). Without the tag Brevo returns 400 "An active DOI template does not exist".

## Settings newsletter switch

`GET/PUT /users/me/newsletter`, available to every member.

- Status is read from Brevo, so email unsubscribes show as off.
- Off removes the member from the list and sets `newsletterOptIn: false`, for vendors and organizers too.
- On syncs with `explicitOptIn`. This is the **only** path that clears a Brevo unsubscribe (`emailBlacklisted: false`). Automatic syncs must never re-subscribe someone.
- Switching on before verifying is remembered until verification.
- Google-only accounts see a note instead of Change Password.

## Email categories (CASL, Kera's intent)

1. **Account and service emails** (verification, password reset, contact messages, review updates, receipts): no consent or opt-out needed, always sent.
2. **Membership notices** (renewal reminders, account changes): consent-exempt. Keep strictly factual with no promotion mixed in. The opt-out requirement is a grey area (the CRTC suggests an unsubscribe mechanism); Kera prefers no opt-out.
3. **Newsletter:** consent plus unsubscribe, controlled by the Settings switch.

Upgrade offers and "what Pro includes" pitches are **promotional** (category 3). They may rely on implied consent from the member relationship but need an unsubscribe. Never mix them into category 2.

## Design for membership reminder emails (not built, tracker T030)

Transactional, sent by the backend through Brevo's SMTP API on a daily Render cron job (about $1/mo). Not a Brevo marketing automation, because those are blocked for anyone who clicked an email unsubscribe link. Strictly factual: end date, renew-current-plan link, what their current plan includes.

## Templates and deliverability

- All three templates (verification, contact, admin message) use the self-hosted wordmark `frontend/public/email-logo.png` through `EMAIL_LOGO_IMG` (`backend/src/utils/emailBranding.ts`) and send a plain-text `textContent` part.
- SPF, DKIM and DMARC for Brevo are correct.
- Escape user text in HTML emails with `backend/src/utils/escapeHtml.ts`.
