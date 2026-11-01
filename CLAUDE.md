# CLAUDE.md — VI Markets Network

Read automatically at session start. This file holds what stays true: rules, structure and gotchas. **It holds no to-do lists or project status.** Rebuilt Nov 1, 2026.

## Where things live

| What | Where |
|---|---|
| Open work, status, priorities, decisions | [VI Markets Tracker](https://docs.google.com/spreadsheets/d/1BZf0svrZLunYci93LyrrEy5XzggmtRi3a8NpBgb82jQ/edit) (sheet ID `1BZf0svrZLunYci93LyrrEy5XzggmtRi3a8NpBgb82jQ`) |
| What happened, session by session | [VI Markets Project Log](https://docs.google.com/document/d/17DROI5db_NJGQln8lEEfqJ-w5xMmWITUsCyw5rg9IVk/edit) (doc ID `17DROI5db_NJGQln8lEEfqJ-w5xMmWITUsCyw5rg9IVk`) |
| Email, Brevo, CASL | `docs/email-and-brevo.md` |
| Security detail and reasons | `docs/security.md` |
| Featured placement spec | `docs/featured-spec.md` |

- Read the tracker and the latest log entry before planning work. Update the same files at the end of a session. Never create dated copies.
- Mark a tracker row Shipped only when its Evidence column names the commit and how it was checked.
- **Don't treat a note as fact until it's checked against the code.** Old notes wrongly recorded Market Event Pages and an admin calendar tab as finished. Neither exists.
- Don't trust these old files: `CLAUDE-v1-old.md`, `VI_Markets_Architecture-v1.md` (February 2026) and `README.md`.

## What this project is

VI Markets Network (vimarkets.ca) is a community directory connecting vendors, shoppers and market organizers across Vancouver Island and the Gulf Islands, BC:

1. **Public directory:** the source of truth for markets across VI
2. **Organizer tools:** lightweight management tools for market organizers
3. **Vendor discoverability:** a place for creators and growers to be found

Signup is open to anyone. The product is run by Kera as a sole proprietor.

## Working with Kera

Kera is the founder and product owner. She is not a developer: she understands logic and can read code but does not write it. She plans in Claude.ai Chat and runs Claude Code from VSCode.

- Explain what you're doing and why, not just the code.
- Flag decisions that could affect other parts of the app.
- If a task could go several ways, present options and let her decide before writing code. Big product decisions get worked out in Chat first.
- Flag anything concerning (security, structure, logic) rather than silently fixing or ignoring it.
- Keep each piece of work to one concern, with a commit between each.

## Environment and workflow

- **OS and shell:** Windows, VSCode, PowerShell. Give Kera PowerShell syntax (`Get-Content`, `$env:VARIABLE`).
- **Branches:** work on `dev`, which builds the Vercel preview. Merge to `main` once confirmed.
- **Pushing:** Claude can't push from this machine. Commit locally, and Kera runs `git push origin dev main` (or the branch in question). Pushing both gives two Vercel builds and one Render build, which is expected.
- **Testing:** no localhost. Kera tests on the stable preview, https://vi-markets-network-git-dev-keramchs-projects.vercel.app/. Per-build hash URLs are frozen snapshots and can't log in.
- **Render has no preview, only `main`.** The preview frontend calls the **live** backend, so backend changes can only be tested after merging to `main`.
- **Never test against the live backend with requests that could write data**, even to fake IDs.
- **Type-checking:** the frontend has **3 known TypeScript errors** (App.tsx `handleUpgradeMembership`, 2× ProfileManager vendor-type typing). Vercel builds anyway. Compare the count against 3, not zero.

## Tech stack

- **Frontend:** React + TypeScript + Vite on Vercel
- **Backend:** Node.js + Express on Render (Starter tier)
- **Database:** Firestore, through the Admin SDK on the backend only
- **Auth:** Firebase Authentication (email/password, Google popup sign-in)
- **Storage:** Firebase Storage, accessed directly from the frontend
- **Email and CRM:** Brevo
- **Payments:** Stripe, live, one-time payments (`mode: "payment"`) with manual renewal

## Architecture rules

- **The frontend does NOT touch Firestore.** All reads and writes go through Express. `frontend/services/firebase.ts` initializes Auth and Storage only.
- **The Admin SDK bypasses Firestore AND Storage rules**, so the rules files only protect direct browser access. **Every backend route must do its own access check.**
- **Auth pattern:** `request()` in `api.live.ts` attaches the user's Firebase ID token to every call. `backend/src/middleware/auth.ts` runs `attachUser` on every route and provides `requireAuth`, `requireAdmin` and `isAdminUser`. New routes must use these.
- **Identity always comes from `req.user`.** Never trust a uid, email or ownerId from the request body or query string.
- **Never create records by editing them.** `set(..., {merge:true})` creates the doc if it's missing, so PATCH routes check the doc exists and return 404.
- **Listing fields members can't set** are dropped in `sanitizeListingUpdate` (`utils/listingAccess.ts`). Admin-only fields must be set server-side.
- **Escape user text in HTML emails.** Validate saved addresses with `utils/urlSafety.ts`.
- **Do NOT add a Cross-Origin-Opener-Policy header.** It breaks Google sign-in.
- The frontend never imports from `backend/`.

## Where the code is

```
backend/src/
  index.ts              App entry: CORS, global rate limit, route mounting
  firebase.ts           Admin SDK init
  middleware/           auth.ts, spamGuard.ts
  routes/               admin, applications, auth, brevo, contact, follows,
                        marketApplications, marketEvents, markets,
                        organizerAccounts, reviews, stripe, users,
                        vendorApplications, vendors
  utils/                brevoSync, emailBranding, escapeHtml, foundingMembers,
                        listingAccess, reviews, urlSafety
  types/models.ts       Backend-only types
  seed.ts               Out of date; doesn't match live registration
backend/scripts/        One-off scripts
scripts/add-slugs.js    One-off slug migration
frontend/
  App.tsx               Routing, global state, inline login form, footer
  types.ts              ALL interfaces + taxonomy constants
  utils.ts              Calendar expansion, ICS, password rules, vendor type helpers
  index.html            Tailwind config (brand colour tokens)
  vercel.json           Must stay in frontend/, not the repo root
  components/           All UI, with NO src/ subfolder
  services/             api.live.ts (live API), firebase.ts, googleAuth.ts,
                        storageUpload.ts
firestore.rules, storage.rules
```

**Main screens:** `HomePage`, `BrowsePage`, `MarketProfile`, `VendorProfile`, `CalendarView`, `Dashboard`, `ProfileManager` (shared vendor and market editor), `OrganizerHub` + `MarketEventForm` (`/dashboard/my-market`), `AdminPanel` (`/hq`), `SignupPage`, `NotificationSettings` (member settings).

**Don't use or revive:**
- `services/api.ts` + `data/mockData.ts`: unused mock API, out of sync.
- `components/LoginPage.tsx`: never routed. The real login is in App.tsx.
- `utils/slugify.ts`: unused, and it queries Firestore from the browser.
- `components/AIConcierge.tsx`: disconnected. Wiring it up would expose the Gemini API key in the browser bundle; it would need a backend proxy first.
- `handleUpgradeMembership` in App.tsx: old pre-Stripe flow, never called.
- `handleSaveChanges` in `NotificationSettings.tsx` looks dead but is deliberately dormant until real push notifications ship. Leave it.

## How key parts work

**Calendar and events.** A recurring series is one `marketEvents` document holding a rule. Dates are expanded in the browser by `expandOccurrences` in `frontend/utils.ts`, with `exceptions` able to cancel or change one date. No per-event pages or admin calendar screen exist. `GET /market-events/:id` has no caller.

**Reviews.** The `reviews` collection is the single source of truth. `GET /markets` and `GET /vendors` attach approved reviews (`utils/reviews.ts`), computed and never stored on the listing. Only admins approve or decline. Owners see their own listing's reviews through `GET /reviews/mine` and can request removal, but never remove a review themselves. One review per member per listing, and a declined one doesn't count. Owners can review their own listing (Kera's choice).

**Applications.** The legacy `applications` collection is live: vendors apply from market profiles and owners approve or reject in `ProfileManager`. `marketApplications`, `vendorApplications` and `organizerAccounts` have no frontend and are admin-only until Phase 2. Don't duplicate subscription fields from `users` into `organizerAccounts`.

**Passwords.** The policy lives in Firebase Console (Authentication → Settings): minimum 8 characters plus 1 special character. It's mirrored by hand in `PASSWORD_RULES` + `PASSWORD_POLICY_MESSAGE` (`frontend/utils.ts`) and the message in `/users/register`. **Update all of them if the policy changes.** A mismatch caused the Sept 29 "Registration failed" signups.

**Email verification** has only worked since Sept 29, 2026. Members who signed up earlier are unverified in Firebase.

**Google sign-in.** `services/googleAuth.ts` uses **popup**, which works on iPhone without the `/__/auth` rewrite that redirect would need. `POST /users/register-oauth` creates the profile from the verified token. In-app browsers (Instagram, Facebook) get an "open in Safari or Chrome" note because Google blocks sign-in there. Decided: Facebook maybe later, Apple no, Instagram login impossible.

**Images.** `resizeToWebP` in `ImageUploader.tsx` resizes client-side and converts HEIC/HEIF. `storage.rules` allows market and vendor image writes by the owner or an admin.

**Signup timing hack.** `onSignupSuccess` in App.tsx has an intentional 4-second refetch delay so the logo upload can finish.

## Pricing

- **Free forever:** get listed, be found, connect to markets manually.
- **Pro (introductory):** $30 CAD/6 months or $50 CAD/12 months, one-time payment, manual renewal. The rate is locked in as long as they renew on time; lapsed accounts drop to Free.
- **Founding members:** permanent free access, flagged manually (`foundingMember: true`), exempt from all tier gates.
- A "Standard" tier was abandoned before launch. Ignore any reference to it.

## Design rules

- No text smaller than 14px anywhere.
- Never use `font-bold` with Rammetto One (`font-serif`).
- On dark backgrounds, always use `brand-teal-light`, never `brand-light-blue` or `brand-blue`, for text.
- Kera wants labels on every form field, not placeholders.

**Colour tokens.** Several names don't match their colours because a palette change reused them. Use the existing names as they are, and don't introduce new ones. The rename is deliberately deferred.

| Use this token | Actual colour |
|---|---|
| `brand-blue` | `#4A4243` Charcoal (dark UI) |
| `brand-gold` | `#D43B6A` Rhubarb (primary accent) |
| `brand-light-blue` | `#2E7A72` Teal (primary UI) |
| `brand-cream` | `#EBF5EC` Mint (light backgrounds) |
| `brand-teal-light` | `#9DD4CF` Teal-light (dark backgrounds only) |
| `brand-violet` | `#7B5EA7` Violet (secondary accent) |
| `brand-text` | `#2C2828` Near-black (body text) |

`brand-teal` and `brand-rhubarb` **do not exist** in the Tailwind config, so classes using them render with no colour.

## Taxonomy

Source of truth: `frontend/types.ts` (`VendorTypes`, `VendorTags`, `MarketCategories`, `MarketTags`).

- **Vendors:** 18 types, maximum 3 per vendor, used for Brevo segmentation, plus about 130 tags. `ProfileManager` groups the tags visually.
- **Markets:** 12 types (markets can have several) plus tags.
- **The vendor `category` field is legacy.** Always use `vendorTypes` through `getVendorTypes` / `vendorTypeLabel` in `frontend/utils.ts`.

## Firestore collections

`users`, `markets`, `vendors`, `marketEvents`, `reviews`, `follows`, `applications` (live, legacy) and, with no UI yet, `organizerAccounts`, `marketApplications`, `vendorApplications`.

## Good to know

- Logout being instant is correct behaviour, not a bug.
- `isAdmin` checks in the rules files cost an extra read each. Upgrade to custom claims before scaling.
- Known duplication, not urgent: fuzzy search (`BrowsePage`, `ProfileManager`, `HomePage`), the market-or-vendor check, and slug generation (backend and `add-slugs.js`).
- `DELETE /follows/:id` has no caller. The site unfollows with `DELETE /follows?…`.
- Brevo sync failures before a member is verified are logged and expected. See `docs/email-and-brevo.md`.
