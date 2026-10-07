# CLAUDE.md — VI Markets Network

This file is read automatically by Claude Code at session start.
Last updated: September 29, 2026

---

## What This Project Is

VI Markets Network (vimarkets.ca) is a community directory platform
connecting vendors, shoppers, and market organizers across Vancouver
Island and the Gulf Islands, BC. Three core purposes:

1. **Public directory** — source of truth for markets across VI
2. **Organizer tools** — lightweight management tools for market organizers
3. **Vendor discoverability** — platform for creators and growers to be found

**Public for Phase 1.** Signup is open to anyone — the beta gate code
has been removed. Not yet being actively promoted beyond Kera's own
circle while Phase 1.3 features get finished. Founding members
(flagged manually, `foundingMember: true`) have permanent free access.
Stripe payments are live and confirmed working (real test purchases
completed successfully). Business license application submitted
(Saanich/Victoria, sole proprietor). Focus is resolving user feedback,
finishing Phase 1.3 features, and prepping for a wider promotion push.

---

## Who You're Working With

Kera is the founder and product owner. She is not a developer.
She understands logic and can read code but does not write it.
She runs Claude Code prompts in her terminal (PowerShell) based on
prompts drafted in a separate planning session (Claude.ai chat).

**Always:**
- Explain what you're doing and why, not just the code
- Flag decisions that could affect other parts of the app
- Ask clarifying questions before writing code if a task could go
  several ways — present options and let her decide
- Flag anything concerning (security, structure, logic) rather than
  silently fixing or ignoring it
- Keep prompts isolated to one concern — commits happen between each

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite → deployed on Vercel
- **Backend:** Node.js + Express → deployed on Render (Starter tier, $7/mo, cold starts eliminated)
- **Database:** Firebase Firestore (via Admin SDK on backend only)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage (accessed directly from frontend)
- **Email/CRM:** Brevo (transactional email + contact sync)
- **Payments:** Stripe — **live and confirmed working.** One-time payment
  model (not recurring): $30 CAD/6mo or $50 CAD/12mo, manual renewal.
  Rate locked in as long as renewed on time; lapsed accounts drop to Free.
  Recurring billing is a Phase 2 item. `stripe.ts` route confirmed live.
- **Applications management:** Possibly JotForm — Phase 3

---

## Pricing Tiers (CAD)

- **Free forever** — get listed, be found, connect to markets manually
- **Pro (introductory rate)** — $30 CAD/6mo or $50 CAD/12mo, one-time
  payment, manual renewal, rate locked in as long as renewed on time
- **Founding members** — permanent free access, flagged
  `foundingMember: true` manually in admin panel, exempt from all tier gates
- Phase 2 will introduce a fuller tier structure once application tools
  and other paid features exist; current introductory Pro members would
  be grandfathered at their rate

*(Note: an earlier three-tier Free/Standard-$5/Pro-$12 model was
scoped and abandoned before launch. If you see references to
"Standard" tier anywhere in old docs or code comments, it's dead —
ignore it.)*

---

## Architecture Rules

- **Frontend does NOT touch Firestore directly.** All Firestore reads
  and writes go through the Express backend via Admin SDK.
- **Firebase Storage IS accessed directly from the frontend.**
- **Firebase Admin SDK bypasses Firestore AND Storage security rules** —
  so the rules files only protect direct browser access. **Every backend
  route must do its own access check.** (Until Sept 29, 2026 most routes
  didn't — see "Security lockdown" below.)
- **Backend auth pattern (Sept 29, 2026):** the frontend `request()` in
  `api.live.ts` attaches the signed-in user's Firebase ID token to every
  call. `backend/src/middleware/auth.ts` runs `attachUser` on every route
  (sets `req.user` from the token, never blocks) and provides
  `requireAuth` / `requireAdmin` / `isAdminUser`. Identity always comes
  from `req.user` — **never trust a uid, email or ownerId sent in the
  request body or query string.** New routes must use these helpers.
- **Never create records by editing them:** Firestore `set(..., {merge:true})`
  creates the doc if it doesn't exist. PATCH routes check the doc exists
  first and return 404 otherwise.
- **Testing workflow:** `dev` branch → Vercel preview deployment
  (stable URL) → merge to `main` once confirmed working on preview.
  No localhost testing — Kera tests on the live preview/production site.
  Stable `dev` preview: https://vi-markets-network-git-dev-keramchs-projects.vercel.app/
  (not the per-build hash URLs, which are frozen snapshots). The preview
  frontend calls the **live** backend, so backend changes can only be
  tested after merging to `main` (see Render note in Known Issues).
- **Never test against the live backend with requests that could write
  data**, even to fake IDs — old code has created junk records this way.

---

## Folder Structure

```
vi-markets-network/                   ← repo root
├── .claude/                          ← Claude Code config (do not edit manually)
├── backend/
│   ├── scripts/                      ← One-off migration/utility scripts
│   └── src/
│       ├── middleware/
│       │   └── auth.ts               ← attachUser / requireAuth / requireAdmin
│       ├── utils/
│       │   ├── escapeHtml.ts         ← Escape user text in HTML emails
│       │   ├── foundingMembers.ts    ← Founding-member UIDs for public badge
│       │   └── listingAccess.ts      ← ownsListing + protected listing fields
│       ├── routes/                   ← Express route handlers
│       │   ├── admin.ts
│       │   ├── applications.ts       ← Legacy vendor→market applications (live UI)
│       │   ├── auth.ts               ← GET /auth/me only (token-based)
│       │   ├── brevo.ts
│       │   ├── contact.ts            ← Profile contact form → Brevo
│       │   ├── follows.ts
│       │   ├── marketApplications.ts
│       │   ├── marketEvents.ts
│       │   ├── markets.ts
│       │   ├── organizerAccounts.ts
│       │   ├── reviews.ts
│       │   ├── stripe.ts             ← Live Stripe checkout + webhook
│       │   ├── users.ts
│       │   ├── vendorApplications.ts
│       │   └── vendors.ts
│       ├── types/
│       │   └── models.ts             ← Backend-only TypeScript types
│       ├── firebase.ts               ← Firebase Admin SDK init
│       ├── index.ts                  ← Express app entry point
│       └── seed.ts                   ← ⚠️ produces data in a shape that no
│                                        longer matches live registration —
│                                        would need re-syncing if ever reused
├── frontend/
│   ├── components/                   ← All UI components (NO /src/ subfolder)
│   │   ├── AboutPage.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── AIConcierge.tsx           ← ⚠️ ORPHANED — activation button was
│   │   │                               already removed from the live site;
│   │   │                               this component is fully disconnected.
│   │   │                               Do NOT wire it back up: it would
│   │   │                               expose the Gemini API key in the
│   │   │                               public browser bundle. Recommended:
│   │   │                               delete outright unless there's a
│   │   │                               specific reason to keep the code for
│   │   │                               reference (see Known Issues).
│   │   ├── BrowsePage.tsx
│   │   ├── CalendarView.tsx
│   │   ├── ContactForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── HomePage.tsx
│   │   ├── Icons.tsx
│   │   ├── ImageUploader.tsx         ← Includes resizeToWebP: client-side
│   │   │                               resize + HEIC/HEIF conversion — LIVE
│   │   ├── LoginPage.tsx             ← ⚠️ DEAD — never routed/imported.
│   │   │                               Real login form is inline in App.tsx
│   │   ├── MarketCard.tsx
│   │   ├── MarketEventForm.tsx
│   │   ├── MarketProfile.tsx
│   │   ├── Modal.tsx
│   │   ├── OrganizerHub.tsx
│   │   ├── PasswordInput.tsx         ← Reusable show/hide password toggle,
│   │   │                               used by Login, Signup, Reset
│   │   │                               Password, and NotificationSettings
│   │   ├── PhotoGallery.tsx          ← Reusable lightbox (vendor profiles)
│   │   ├── PricingPage.tsx
│   │   ├── ProfileManager.tsx        ← Shared vendor + market profile editor
│   │   ├── ResetPasswordForm.tsx     ← "Set new password" half of the
│   │   │                               password reset flow — verifies the
│   │   │                               Firebase oobCode, confirms the new
│   │   │                               password, opens Login modal on success
│   │   ├── ReviewForm.tsx
│   │   ├── ShareButton.tsx
│   │   ├── SignupPage.tsx
│   │   ├── VendorCard.tsx
│   │   ├── VendorProfile.tsx
│   │   └── ... (others)
│   ├── data/
│   │   └── mockData.ts               ← Mock/test data (not used in production)
│   ├── services/
│   │   ├── api.live.ts               ← Live API calls to Express backend
│   │   ├── api.ts                    ← Mock API — confirmed unused, and has
│   │   │                               drifted out of sync with the real API;
│   │   │                               do not resurrect for local testing
│   │   ├── firebase.ts               ← Firebase init (Auth + Storage ONLY — no Firestore)
│   │   └── storageUpload.ts          ← Firebase Storage upload helpers
│   ├── utils/
│   │   └── slugify.ts                ← ⚠️ DEAD — and one function queries
│   │                                    Firestore directly from the browser,
│   │                                    violating the frontend/Firestore
│   │                                    architecture rule. Safe to delete;
│   │                                    do not call it if resurrected.
│   ├── App.tsx                       ← Root component, routing, global state,
│   │                                    footer.
│   ├── index.tsx                     ← Entry point
│   ├── types.ts                      ← ALL TypeScript interfaces + taxonomy constants
│   ├── utils.ts                      ← General utility functions
│   ├── vercel.json                   ← Vercel config (must stay in frontend/, not root)
│   └── vite.config.ts
├── scripts/
│   └── add-slugs.js                  ← Root-level one-off scripts
├── firebase.json
├── firestore.rules
├── storage.rules
└── CLAUDE.md                         ← This file
```

**Critical path notes:**
- Component files: `frontend/components/ComponentName.tsx` — no `/src/` subfolder
- Types: `frontend/types.ts` — not `frontend/data/types.ts`
- `vercel.json` must stay in `frontend/` — moving it breaks deployment
- Frontend never imports from `backend/` — they are fully separate
- Fuzzy-search logic is currently written independently three times
  (`BrowsePage.tsx`, `ProfileManager.tsx`, `HomePage.tsx`) — candidate
  for a shared helper, not urgent
- The "is this a market or vendor" type check is duplicated in two files
- Slug-generation logic is duplicated (not shared) between the backend
  and the root `add-slugs.js` migration script

---

## Terminal / Environment

- **OS:** Windows, VSCode
- **Shell:** PowerShell — always use PowerShell syntax
  - Use `Get-Content` not `cat`
  - Use `$env:VARIABLE` not `$VARIABLE` for env vars
  - Path separators: use `\` or forward slash, both work in PS

---

## Design Tokens

**Intended palette:**
```
Charcoal:    #4A4243   (dark UI, body text)
Mint:        #EBF5EC   (light backgrounds)
Teal:        #2E7A72   (primary UI colour)
Teal-light:  #9DD4CF   (use on DARK backgrounds only)
Rhubarb:     #D43B6A   (primary accent)
Violet:      #7B5EA7   (secondary accent)
Near-black:  #2C2828   (body text)
```

**⚠️ Known token mess — confirmed still unresolved as of July 2, 2026:**
The Tailwind token names in `frontend/index.html` do not match the actual
colours due to a mid-project palette change where names were reused rather
than refactored. This is deliberately deferred, not new drift:

| Token name | Actual colour | Should be named |
|---|---|---|
| `brand-blue` | `#4A4243` Charcoal | `brand-charcoal` |
| `brand-gold` | `#D43B6A` Rhubarb | `brand-rhubarb` |
| `brand-light-blue` | `#2E7A72` Teal | `brand-teal` |
| `brand-cream` | `#EBF5EC` Mint | ✓ fine |
| `brand-teal-light` | `#9DD4CF` Teal-light | ✓ fine |
| `brand-violet` | `#7B5EA7` Violet | ✓ fine |
| `brand-text` | `#2C2828` Near-black | ✓ fine |

Until this is cleaned up, use the existing token names as-is throughout
components — do not introduce new names mid-codebase. Full rename is a
deferred, post-launch refactor.

**Colour rule:** On dark backgrounds, always use `brand-teal-light` (#9DD4CF),
never `brand-light-blue` or `brand-blue` for text.

- No text smaller than 14px anywhere in the app
- Never use `font-bold` with Rammetto One (`font-serif`) — ever

---

## Taxonomy — Vendor

Two-level structure. Max 3 types per vendor.

**18 Vendor Types** (broad — used for Brevo segmentation):
Agriculture & Produce, Meat & Seafood, Dairy & Eggs, Baked Goods,
Prepared Foods & Preserves, Food Trucks & Street Food (added Oct 6, 2026),
Beverages, Fine Art & Artisan,
Craft & Homemade, Clothing & Accessories, Wellness & Beauty,
Home & Garden, Children's Products, Pet Products,
Vintage & Collectibles, Books & Music, Experiences & Services,
Commercial / Reseller

**~130 Vendor Tags** grouped visually in ProfileManager into:
Fresh & Farm, Food & Drink, Art & Craft, Clothing & Accessories,
Home & Wellness, Kids & Pets, Vintage & Collectibles, Books & Music,
Services & Experiences, Commercial / Reseller, How you make it,
Dietary & Allergen, Payment

---

## Taxonomy — Market

**12 Market Types** (array field — markets can have multiple):
Farmers Market, Artisan & Craft Market, Farm Gate Stand,
Flea Market / Swap Meet, Food Truck Court, Night Market,
Pop-Up Market, Vintage & Collectible Market,
Holiday & Seasonal Market, Street Market, Specialty Market, Youth Market

**Market Tags** grouped into:
Schedule & Format, Vendor Policy, Admission, Amenities, Experience,
Payment Accepted

---

## Brevo Integration

- Brevo attributes must be **Text type** — multi-select attributes
  silently reject API values.
- Multi-value fields use **pipe-delimited strings** (e.g. `"Farm|Artisan"`)
- Segment in Brevo using "contains" filter
- Frontend sends market types under key `marketCategories` (not `marketTypes`)
  — confirmed by tracing SignupPage.tsx → goNext at wizard step 4
- System mail address: `hello@vimarkets.ca`
- Attributes in use: `FIRSTNAME`, `LASTNAME`, `BUSINESSNAME`, `CITY`,
  `MEMBERTYPE`, `IS_MEMBER`, `SUBSCRIPTION_TIER`, `FOUNDING_MEMBER`,
  `VENDOR_CATEGORIES`, `MARKET_CATEGORIES`
- `termEnds` dates sync to Brevo for renewal automations —
  format required: `MM/DD/YYYY` with slashes, not ISO 8601
- Registration sync (new user → Brevo contact) is complete and confirmed working

---

## Current State — September 29, 2026

### 🔒 Security lockdown — completed Sept 29, 2026
A full audit found that almost every backend route accepted requests from
anyone (the Admin SDK skips the rules files, and only `/admin` and Stripe
checkout checked the caller). Anyone could have made themselves admin via
`PATCH /users/:id`, downloaded every member's record (the site even loaded
the full list into every visitor's browser), sent phishing email from
hello@vimarkets.ca via `/brevo/send-verification`, or edited any listing.
No sign any of it was used. Fixed in 5 steps, all live and verified with
both outside checks and a logged-in "second member" console test:
- **Users:** members edit only their own doc and only safe fields
  (`SELF_EDITABLE_USER_FIELDS` in users.ts); `GET /users` admin-only and
  only fetched by the frontend for admins; `GET /auth/me` uses the token
  (the `?email=` param is ignored); `/register` returns 409 (not the
  existing record) for a duplicate email; legacy `POST /auth/login` removed.
- **Public founding-member badge:** `GET /markets` and `GET /vendors`
  include `ownerFoundingMember` (computed, never stored) instead of the
  profile pages needing the member list.
- **Markets/vendors:** owner or admin only. For non-admins the profile
  editor's full-object save has `ownerId`, `status`, `isFeatured`,
  `featuredUntil`, `impressionCount`, `joinDate`, `slug`, `reviews`
  silently dropped (`sanitizeListingUpdate` in utils/listingAccess.ts).
  **Featured build must set `isFeatured`/`featuredUntil` server-side**
  (Stripe webhook or admin) — members can't set them.
- **Events:** create/edit/archive by the market owner, the event's
  organizer, or admin; drafts/cancelled/archived only visible to them.
- **Email:** verification email only to the signed-in caller, link built
  server-side; contact form only sends to a listed market/vendor's
  contact email; `/brevo/subscribe` and verification rate limited
  (5/hr/IP); `trust proxy` set so limits are per visitor.
- **Reviews/follows/applications:** review author/userId come from the
  account, rating 1–5, approve/decline admin-only; follows are self-only;
  applications visible only to the vendor and receiving market.
- **Phase 2 routes** (marketApplications, vendorApplications,
  organizerAccounts) are admin-only until their UI + permissions are built.
- **CORS** limited to vimarkets.ca, this project's Vercel previews, localhost.
- **Spam guard (Oct 6, 2026):** contact form, footer newsletter signup and
  account signup carry a hidden honeypot field + time-to-submit check
  (`frontend/components/SpamGuard.tsx` → `backend/src/middleware/spamGuard.ts`).
  Bots get a fake success (contact/subscribe) or a generic error (register)
  and nothing is sent or saved; each block is logged in Render as
  "Spam guard blocked …". Kera chose this over reCAPTCHA (friction,
  accessibility, Google tracking); if spam still gets through, add
  Cloudflare Turnstile, not reCAPTCHA.
- **Stripe checkout** upgrades the token's uid, not a uid from the body.

### ✅ Working (confirmed via full codebase audit)
- User auth: signup, login, forgot-password, and **full password
  reset** — `sendPasswordResetEmail` sends the link, and
  `ResetPasswordForm.tsx` handles the receiving side (verifies the
  Firebase oobCode via `verifyPasswordResetCode`, confirms the new
  password via `confirmPasswordReset`, opens the Login modal on
  success), plus email verification page
- **Password policy** lives in Firebase Console (Authentication →
  Settings): min 8 chars + 1 special character, enforced. Mirrored by
  hand in `PASSWORD_RULES` + `PASSWORD_POLICY_MESSAGE` (frontend/utils.ts)
  and the backend message in `/users/register` — **update both if the
  policy changes.** A mismatch here caused the Sept 29 "Registration
  failed" signups. Signup, Reset Password and Change Password (in
  NotificationSettings) all use the shared `PasswordRulesList` live
  checklist and `passwordMeetsPolicy` check (Oct 6, 2026).
- **Email verification actually works as of Sept 29.** Before that, the
  link used the user's ID token as the oobCode and the site never called
  `applyActionCode`, so nobody was ever verified in Firebase. Members
  who signed up before Sept 29 are still unverified; nothing currently
  depends on verification status.
- Login shows plain-language errors (`friendlyLoginError` in App.tsx);
  reset/change-password forms tell password managers which account the
  password is for (hidden `autocomplete="username"` field).
- Admin "message a member" sends via Brevo (July 7); an old header bug in
  `request()` that likely broke it was fixed Sept 29.
- `/users/register-oauth` backend endpoint built for Google sign-in (see
  Phase 1.3) — not yet called by the frontend.
- Show/hide password toggle (`PasswordInput.tsx`) on every password
  field app-wide: Login, Signup, Reset Password, NotificationSettings
- Market and vendor directory — browse, search, filter
- Public market and vendor profiles — both now share a common Identity
  Panel design (light `#D6E9E6` panel with teal bottom border, white
  circular logo plate, Follow button — vendor profile also has an
  Email button — and a type-tags row under the name); hero photo strip
  hidden on mobile for both; vendor profile body is two-row (Find Us
  At | Gallery, then About + Connect | Reviews)
- `headerPhotoUrl` + `headerPhotoPosition` on both Vendor and Market
  types, with Top/Center/Bottom focal point control (25/50/75%)
- `PhotoGallery` component — built-from-scratch lightbox, full a11y
  (focus trap, ESC, arrow nav, screen reader attributes)
- Client-side image resizing (`resizeToWebP` in `ImageUploader.tsx`) +
  HEIC/HEIF conversion — live across signup, vendor, and market uploads
- `storage.rules` — admin-assisted uploads now allowed: market/vendor
  image writes succeed if either `ownerId` matches the uploader or the
  uploader's own `users/{uid}.isAdmin === true`
- Admin panel (HQ): member list/search/pagination, hard-delete member,
  direct profile editing, review moderation
- **Reviews (fixed Oct 6, 2026):** the `reviews` collection is the single
  source of truth. `GET /markets` / `GET /vendors` attach each listing's
  **approved** reviews (computed in `utils/reviews.ts`, never stored on the
  listing — `reviews` is a computed field in `sanitizeListingUpdate`).
  Admin HQ loads every review via admin-only `GET /reviews`; only admins
  approve/decline. Owners see pending + approved reviews of their own
  listing read-only via `GET /reviews/mine` (profile editor "Reviews"
  tab). One review per member per listing (a declined one doesn't count).
  Owners CAN review their own listing (Kera's choice). Before this fix,
  reviews were saved but never displayed anywhere.
- **Review removal requests (Oct 6, 2026):** owners can "Request removal"
  of a review of their listing with a reason
  (`POST /reviews/:id/removal-request`, stored as `removalRequest` on the
  review, emails hello@vimarkets.ca). Admin HQ → Reviews → Removal
  Requests: "Remove review" declines it, "Keep review" dismisses the
  request (`POST /reviews/:id/removal-request/resolve`, admin-only).
  Owners never remove reviews themselves — keeps reviews trustworthy.
- Organizer Hub — full Event Manager (add/edit/delete/archive,
  recurring series), ICS/Google Calendar export
- **Stripe payments — live and confirmed** (see Tech Stack)
- Brevo contact sync on registration, including all attributes
- React Router v6 — slug-based URLs for all profiles
- Follow/favorite markets & vendors, shown on Dashboard
- Legal pages, About page, footer newsletter → Brevo
- OG/Twitter Card meta tags + `og-image.png`
- `dev` branch + Vercel preview workflow in place
- Market Event Pages — individual public pages per event
- Admin calendar tab — admin can add/edit/delete events from HQ
- Location permission — no longer fires automatically on page load;
  user-triggered "Set my location" button in place
- TypeScript warnings (previously flagged at App.tsx:324,
  ProfileManager.tsx:211) — resolved
- `NotificationSettings.tsx` — misleading push-notification copy replaced
  with honest "coming soon, add to home screen" messaging; all three
  toggles disabled (opacity-50, cursor-not-allowed, onChange blocked);
  "Save Changes" button and its wrapper removed. `handleSaveChanges` left
  in place intentionally, currently unused — dormant until real push
  notifications ship, not dead code to delete.

### ⚠️ Discovered but not built (confirm before relying on these)
- **Promotions (paid add-on) page** — confirm button does a `console.log`,
  no purchase is processed. Modal says "Payment flow — coming in Phase 2."
- **Map on market profile** — literal placeholder, renders the text
  `[ Map Placeholder ]`.
- Generic/mismatched help-tooltip copy about iOS microphone dictation,
  pasted identically across 4 unrelated form fields — needs real copy.

### 🆕 Found July 2 (second pass) — need Kera's own action, not Claude Code
- **"Your City" field data bug** — NOT a code bug. Traced `NotificationSettings.tsx`:
  the `city` state and input are wired correctly (`currentUser.city ?? ''`).
  The `hello@vimarkets.ca` account has its own email address stored as the
  literal value of its `city` field in Firestore — a bad data entry, not a
  bug in the component. Kera needs to correct this directly in Firebase
  Console. No prompt needed.
- **"VI Markets Guide Admin" account visible in the live Featured Markets
  & Vendors grid on the homepage** — an internal/admin account is showing
  up in public-facing Featured placement, tagged "Specialty Market · Night
  Market." Needs Kera to check whether this account should be hidden from
  the public directory entirely, or just excluded from Featured.
- **`NotificationSettings.tsx` "Back to home" link** — same pattern as the
  profile pages' back-link cleanup already tracked; this file has its own
  instance, worth including in that same pass.

### 🟡 Phase 1.3 / Near Term
- **Google sign-in — in progress (Sept 29).** Done: Firebase Console
  provider enabled, authorized domains (vimarkets.ca, www, dev preview),
  Google consent-screen branding (support email is Kera's Gmail — a
  hello@ Google account wasn't possible), and the backend endpoint
  `POST /users/register-oauth`. Remaining: signup wizard button (replace
  the fake "Continue with Google" on step 3), login button, iPhone/in-app
  browser handling (vercel.json `/__/auth` rewrite + redirect sign-in;
  Google blocks sign-in inside Instagram/Facebook in-app browsers), and
  linking existing email/password members. Decided: **Facebook maybe
  later, Apple no** ($99/yr + relay emails), **Instagram login impossible**.
- **Email deliverability:** done Oct 6, 2026 — all 3 email templates
  (verification, contact, admin message) now use the self-hosted
  wordmark `frontend/public/email-logo.png` via `EMAIL_LOGO_IMG`
  (backend/src/utils/emailBranding.ts) instead of a borrowed Gmail
  image-proxy URL, and send a plain-text `textContent` part. SPF/DKIM/DMARC
  for Brevo are correct. Still to do (Kera, no code): mail to
  hello@vimarkets.ca goes through GreenGeeks, whose SpamAssassin tags
  `***SPAM***` (which then breaks DKIM when forwarded to Gmail) —
  whitelist Brevo in cPanel.
- **Signup polish (agreed Sept 29):** remove fake Google button until
  real; remove placeholders from all fields and link every `<label>` to
  its input (most signup labels have no `htmlFor`); raise 12px helper
  text to 14px; "Select all that apply" contradicts the 3-type max;
  replace the iOS-microphone HelpTip on description; add "we'll send a
  confirmation link" hint under email. Kera to decide: newsletter opt-in
  checkbox for vendors/markets (they're currently synced to Brevo with no
  checkbox — CASL consideration). Agreements step says paid plans
  auto-renew (untrue) — Kera: low priority while nobody is paying.
- Vendor contact form vs. market Message-button disclosure pattern —
  open question, deliberately parked pending Kera's own feedback-gathering.
  Note: contact emails are public in `GET /markets`/`/vendors` anyway.
- "Featured" paid placement — **fully spec'd July 2, 2026, ready to build.**
  See dedicated section below.
- Add `id="hero"` to homepage hero div for scroll-to-top/anchor targeting
- Fix remaining teal-on-dark text to `brand-teal-light` — Farmers Market
  category pill and any others
- Remove `font-bold` from all Rammetto One instances
- Cancel account feature — reverts to Free tier, profile remains (status unconfirmed)
- Delete account feature — immediate public removal, 30-day soft delete
  then automated permanent purge (status unconfirmed)
- Light/dark mode toggle (status unconfirmed)
- Accessibility pass — form field labels vs. placeholders (Kera wants
  placeholders removed everywhere, labels on everything — see Signup polish)
- `useNavigate()` migration — replace remaining `onNavigate`/`onBack`
  props; three navigation patterns currently coexist

### 🟡 Featured Placement — Full Spec (locked July 2, 2026)

- **Eligibility:** Any member, Free or Pro, may purchase Featured
- **Acquisition:** Self-serve Stripe checkout (mirrors existing Pro
  flow) OR admin manually grants it (for gifting/rewarding — mirrors
  the `foundingMember` override pattern)
- **Duration/Price:** Monthly only, $10 CAD/month introductory rate —
  revisit once real traffic data exists
- **Bundle included:**
  - Boosted ranking in Browse/search results
  - Priority placement within category filter results
  - Homepage rotation — true random draw of the pool every page load,
    no hard cap on how many members can hold Featured at once
  - Site-wide Spotlight toast/carousel — honest "Spotlight: [name],
    [type] in [city]" framing, NOT styled as fake real-time social
    proof (e.g. do not imply "someone just viewed/bought this" —
    this isn't a live action, it's a promotional rotation). Capped to
    once or twice per session, dismissible, non-blocking.
- **Explicitly excluded:**
  - Card badge — dropped deliberately; Kera's reasoning: badge value
    is only at the discovery/browsing stage, irrelevant once someone's
    already on the profile page
  - Newsletter mention — dropped for now; **no newsletter exists yet**
    to attach a mention to. "Build an actual newsletter" is a separate
    future project (content strategy, cadence) — not part of this build.
- **Impression stats:** Simple running total (not broken down by
  surface). Visible to the vendor/market on their own dashboard
  ("Your Featured listing was shown X times this month") and to admin
  as a summary across all Featured listings. This is also the answer
  to "why would anyone pay for a rotating pool with no visibility
  guarantee" — real numbers replace a vague promise.

**Build order — 7 isolated Claude Code prompts, commit between each:**
```
1. Data model — isFeatured + featuredUntil + impressionCount fields
   on User/Vendor/Market types; admin HQ manual grant/revoke toggle
   (foundation — testable without Stripe yet)
2. Stripe self-serve checkout for Featured ($10/mo), webhook sets
   isFeatured + featuredUntil on payment success
3. Shared impression-tracking endpoint (increments impressionCount) —
   build before the display pieces so each one can call it
4. Homepage rotation component (logs impression on render)
5. Browse/search ranking boost + category filter priority (logs impression)
6. Site-wide Spotlight toast component (logs impression)
7. Impression stats display — vendor/market dashboard + admin summary view
```

None of these 7 prompts have been written or run yet — this is a fresh
build starting from prompt #1 next session.

### 🔵 Phase 2
- Recurring Stripe billing (deferred from Phase 1)
- Vendor application system, market application management tools
- Organizer dashboard (full build)
- **Real push notification system** — paired conceptually with
  geolocation (below), since "Nearby Market Alerts" only becomes useful
  once someone's carrying the app on their phone. Requires: service
  worker, web app manifest, Add to Home Screen prompt (Safari-only
  install step on iOS, works since iOS 16.4+), FCM wiring, permission
  UX. `NotificationSettings.tsx` toggles are currently disabled pending
  this build (see Working section).
- Interactive map plotting all markets geographically
- Click-to-set (Instagram-style) focal point picker for header photos
- Multi-day market event support (high priority — vendors currently
  can't add a two-day market as a single event)
- Vendor-submitted market discoverability — connections currently only
  visible on individual vendor profiles, needs broader surface
- `POST /vendors` endpoint — currently asymmetric with markets, which
  support "unclaimed" creation; vendors have no equivalent
- **Build an actual newsletter** — content strategy, cadence, what goes
  in it. Needed before "Featured newsletter mention" (dropped from the
  Featured spec above) can be revisited.

### 🟣 Phase 3 / Future
- AI Concierge — `AIConcierge.tsx` exists, fully built, but its
  activation button has already been removed from the live site, so
  it's currently orphaned dead code. If revived in Phase 3, it needs a
  backend proxy first — activating as-is would expose the Gemini API
  key in the public browser bundle. Recommended: delete the file now
  rather than let unused, unsafe-to-reuse code sit in the repo (see
  Known Issues).
- JotForm or similar for advanced application management
- Professional association features, policy/advocacy work,
  cooperative/revenue sharing model
- OAuth login (Google, Facebook, Apple) — Firebase Auth supports all
  three natively; Apple requires Apple Developer account

---

## Known Issues / Watch List

- **Dead code, safe to delete:** `LoginPage.tsx`, `AIConcierge.tsx`
  (orphaned — its activation button was already removed from the live
  site; recommended for deletion given the API key exposure risk if
  ever wired back up carelessly), `frontend/utils/slugify.ts`,
  `handleUpgradeMembership` in App.tsx (old pre-Stripe upgrade flow,
  never called — it's also the source of the pre-existing
  `setSelectedPlanForPayment` TypeScript error)
- **4 pre-existing TypeScript errors** in the frontend (App.tsx dead
  code above, BrowsePage `category`, 2× ProfileManager vendor-type
  typing). Vercel builds anyway; when type-checking, compare the count
  against 4 rather than expecting zero.
- **CORS locked down and email endpoints rate limited (Sept 29).** Still
  no general rate limiting on other routes or request logging.
- **Backend endpoints never called from frontend:** single-event fetch,
  `GET /reviews` (now admin-only), `DELETE /follows/:id`. Old
  `/auth/login` was removed Sept 29.
- **`marketApplications`/`vendorApplications`/`organizerAccounts` routes**
  have zero frontend callers — built ahead of the UI for Phase 2, and
  **admin-only since Sept 29**. Design real organizer/vendor permissions
  when the UI is built (they still use create-on-edit `set(merge)`).
- **Legacy `applications` collection IS live:** vendors apply from market
  profiles; market owners approve/reject in ProfileManager. Locked to the
  involved vendor/market since Sept 29.
- **`seed.ts`** produces test data in a shape that no longer matches
  what live registration writes — low-stakes now, but would need
  re-syncing if ever reused
- **Storage rules:** ownership checks and auth-gated reads are both in
  place, plus an admin-override OR condition on market/vendor writes
  (see Known Issues entry on `isAdmin()` read cost, below).
- **Token name contamination:** see Design Tokens section — deliberately
  deferred, not new drift.
- **4-second post-signup refetch delay** in `App.tsx` `onSignupSuccess` —
  intentional timing hack to allow logo upload to complete before hub
  renders. Replace with event-driven approach when there's time.
- **`organizerAccounts` collection** — Phase 2 only; avoid duplicating
  subscription fields already in `users` collection.
- **Footer lives in App.tsx** — not a separate component.
- **`vercel.json` must live in `frontend/`** — not project root.
- **localhost dev not used** — testing happens on `dev` branch Vercel
  preview, then live vimarkets.ca after merge to `main`.
- **`isAdmin()` Firestore rule** costs one extra read per evaluation —
  upgrade to custom claims before scaling. Confirmed still unresolved.
  `storage.rules` now duplicates this same pattern (an extra read to
  check `users/{uid}.isAdmin` on market/vendor image writes, to support
  admin-assisted uploads) — same fix would cover both.
- **Logout is instantaneous** — this is correct React/Firebase behaviour,
  not a bug. No fix needed.

- **Render has no preview/staging deployment — only `main`.** Unlike Vercel
  (which builds a live preview for `dev`), Render's backend only deploys from
  `main`. This means any backend route change is untestable until merged —
  the usual dev→preview→main rhythm only fully applies to the frontend.
  Discovered when testing the new /contact/send endpoint: frontend `dev`
  preview called it fine, but got a 404 because Render was still serving
  the old main-branch backend without that route.

---

## Firestore Collections

- `users` — all user accounts (vendors, organizers, admins, community)
- `markets` — market profiles
- `vendors` — vendor profiles
- `marketEvents` — calendar events (owned by organizers)
- `organizerAccounts` — Phase 2 billing/subscription for organizers
- `marketApplications` — Phase 2 vendor application forms
- `vendorApplications` — Phase 2 vendor submissions
- `reviews` — pending/approved/declined reviews
- `follows` — user follow relationships

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/App.tsx` | Root component, routing, global state, footer |
| `frontend/types.ts` | All TypeScript interfaces + taxonomy constants |
| `frontend/utils.ts` | General utility functions (formatTime, getDistance, etc.) |
| `frontend/services/api.live.ts` | Live API calls to Express backend |
| `frontend/services/api.ts` | ⚠️ Unused mock API, drifted out of sync — do not resurrect |
| `frontend/services/firebase.ts` | Firebase init (Auth + Storage only — no Firestore) |
| `frontend/services/storageUpload.ts` | Firebase Storage upload helpers |
| `frontend/components/ImageUploader.tsx` | Upload + client-side resize/HEIC conversion |
| `frontend/components/PhotoGallery.tsx` | Reusable lightbox component |
| `frontend/components/Modal.tsx` | Shared modal wrapper |
| `frontend/components/MarketProfile.tsx` | Public market profile page |
| `frontend/components/VendorProfile.tsx` | Public vendor profile page |
| `frontend/components/ProfileManager.tsx` | Edit profile (market + vendor) |
| `frontend/components/ResetPasswordForm.tsx` | "Set new password" — receiving side of the password reset flow |
| `frontend/components/PasswordInput.tsx` | Reusable show/hide password toggle |
| `frontend/components/OrganizerHub.tsx` | Organizer dashboard at /dashboard/my-market |
| `frontend/components/MarketEventForm.tsx` | Add/edit market events |
| `frontend/components/CalendarView.tsx` | Public calendar |
| `frontend/components/AdminPanel.tsx` | Admin HQ (member messaging here doesn't actually send) |
| `frontend/components/SignupPage.tsx` | Signup wizard |
| `frontend/components/Header.tsx` | Site header + nav |
| `frontend/components/BrowsePage.tsx` | Browse markets / browse vendors |
| `frontend/components/Dashboard.tsx` | User dashboard |
| `backend/src/index.ts` | Express app entry point |
| `backend/src/firebase.ts` | Firebase Admin SDK init |
| `backend/src/routes/stripe.ts` | Live Stripe checkout + webhook |
| `backend/src/routes/users.ts` | Signup (`/register`, `/register-oauth`) via shared `createMemberRecords`, Brevo sync, user edits |
| `backend/src/middleware/auth.ts` | `attachUser` / `requireAuth` / `requireAdmin` — use on every new route |
| `backend/src/utils/listingAccess.ts` | Listing ownership check + admin-only listing fields |
| `backend/src/routes/markets.ts` | Market CRUD |
| `backend/src/routes/vendors.ts` | Vendor CRUD (no unclaimed-creation equivalent yet) |
| `backend/src/routes/marketEvents.ts` | Market event CRUD |
| `backend/src/routes/brevo.ts` | Brevo API integration |
| `backend/src/types/models.ts` | Backend TypeScript types |
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Firebase Storage security rules — ownership + admin-override checks in place |
