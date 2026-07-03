# CLAUDE.md — VI Markets Network

This file is read automatically by Claude Code at session start.
Last updated: April 12, 2026

---

## What This Project Is

VI Markets Network (vimarkets.ca) is a community directory platform
connecting vendors, shoppers, and market organizers across Vancouver
Island and the Gulf Islands, BC. Three core purposes:

1. **Public directory** — source of truth for markets across VI
2. **Organizer tools** — lightweight management tools for market organizers
3. **Vendor discoverability** — platform for creators and growers to be found

Currently in pre-beta. No real users yet — all existing data is test/placeholder.

---

## Who You're Working With

Kera is the founder and product owner. She is not a developer.
She understands logic and can read code but does not write it.
She runs Claude Code prompts in her terminal based on prompts drafted
in a separate planning session (Claude.ai chat).

**Always:**
- Explain what you're doing and why, not just the code
- Flag decisions that could affect other parts of the app
- Ask clarifying questions before writing code if a task could go
  several ways — present options and let her decide
- Flag anything concerning (security, structure, logic) rather than
  silently fixing or ignoring it

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite → deployed on Vercel
- **Backend:** Node.js + Express → deployed on Render (Starter tier, $7/mo)
- **Database:** Firebase Firestore (via Admin SDK on backend only)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage (accessed directly from frontend)
- **Email/CRM:** Brevo (transactional email + contact sync)
- **Payments:** Stripe — Phase 2, not started

---

## Architecture Rules

- **Frontend does NOT touch Firestore directly.** All Firestore reads
  and writes go through the Express backend via Admin SDK.
- **Firebase Storage IS accessed directly from the frontend.**
- Firebase Admin SDK bypasses Firestore security rules — security
  gaps are only exploitable via direct Firebase access, not the backend.
- Changes are committed and pushed continuously — no staging step.
  Vercel (frontend) and Render (backend) deploy on push.

---

## Folder Structure

```
vi-markets-network/                   ← repo root
├── .claude/                          ← Claude Code config (do not edit manually)
├── backend/
│   ├── scripts/                      ← One-off migration/utility scripts
│   └── src/
│       ├── routes/                   ← Express route handlers
│       │   ├── admin.ts
│       │   ├── applications.ts
│       │   ├── auth.ts
│       │   ├── brevo.ts
│       │   ├── follows.ts
│       │   ├── marketApplications.ts
│       │   ├── marketEvents.ts
│       │   ├── markets.ts
│       │   ├── organizerAccounts.ts
│       │   ├── reviews.ts
│       │   ├── users.ts
│       │   ├── vendorApplications.ts
│       │   └── vendors.ts
│       ├── types/
│       │   └── models.ts             ← Backend-only TypeScript types
│       ├── firebase.ts               ← Firebase Admin SDK init
│       ├── index.ts                  ← Express app entry point
│       └── seed.ts
├── frontend/
│   ├── components/                   ← All UI components (NO /src/ subfolder)
│   │   ├── AboutPage.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── AIConcierge.tsx
│   │   ├── BrowsePage.tsx
│   │   ├── CalendarView.tsx
│   │   ├── ContactForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── HomePage.tsx
│   │   ├── Icons.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MarketCard.tsx
│   │   ├── MarketEventForm.tsx
│   │   ├── MarketProfile.tsx
│   │   ├── Modal.tsx
│   │   ├── OrganizerHub.tsx
│   │   ├── PricingPage.tsx
│   │   ├── ProfileManager.tsx
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
│   │   ├── api.ts                    ← Mock API (dev/testing)
│   │   ├── firebase.ts               ← Firebase init (Auth + Storage ONLY — no Firestore)
│   │   └── storageUpload.ts          ← Firebase Storage upload helpers
│   ├── utils/
│   │   └── slugify.ts                ← Slug generation utility
│   ├── App.tsx                       ← Root component, routing, global state, footer
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

---

## Terminal / Environment

- **OS:** Windows, VSCode
- **Shell:** PowerShell — always use PowerShell syntax
  - Use `Get-Content` not `cat`
  - Use `$env:VARIABLE` not `$VARIABLE` for env vars
  - Path separators: use `\` or forward slash both work in PS

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

**⚠️ Known token mess — needs cleanup post-beta:**
The Tailwind token names in `frontend/index.html` do not match the actual
colours due to a mid-project palette change where names were reused rather
than refactored. Current mapping:

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
components — do not introduce new names mid-codebase.

**Colour rule:** On dark backgrounds, always use `brand-teal-light` (#9DD4CF),
never `brand-light-blue` or `brand-blue` for text.

**Fonts:**
- `font-serif` = Rammetto One — display/headlines only, **never with font-bold**
- `font-sans` = Outfit — body text

---

## Coding Conventions

- `id="pagetop-header"` — add only to public-facing informational pages
  (HomePage, PricingPage, SignupPage, AboutPage, future info pages).
  NOT on internal user pages, browse/search pages, or dashboards.
- **Featured badge:** The prop is suppressed (removed from display), not
  deleted. The logic is preserved in MarketCard/VendorCard for Phase 2.
- **Footer** lives in `App.tsx` — it is not a separate component yet.
  Relevant whenever making footer changes.
- **Rammetto One** (`font-serif`) — never add `font-bold`. Ever.

---

## Taxonomy — Vendor

Two-level structure. Max 3 types per vendor.

**17 Vendor Types** (broad — used for Brevo segmentation):
Agriculture & Produce, Meat & Seafood, Dairy & Eggs, Baked Goods,
Prepared Foods & Preserves, Beverages, Fine Art & Artisan,
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
- Phase 1 Brevo sync (new registrations → Brevo contact) is complete

---

## Current State — April 12, 2026

### ✅ Working
- User auth (signup, login, Firebase Auth)
- Market and vendor directory — browse, search, filter
- Public market and vendor profiles
- Admin panel (HQ) with member list, search, pagination
- Image uploads (logo + gallery) via Firebase Storage
- Organizer Hub at `/dashboard/my-market` — Event Manager built
  (add/edit/delete/archive events, edit modal with series scope selector)
- Market event form with market type selection
- Brevo contact sync on new user registration — including all contact
  attributes (VENDOR_TYPES, MARKET_TYPES, etc.) set up and confirmed working
- React Router v6 — slug-based URLs for all profiles
- Slug pattern: `/vendors/{slug}`, `/markets/{slug}`,
  `/events/{event-name}-{YYYY-MM-DD}` (event pages not yet built)
- Homepage skeleton loading — renders immediately, cards lazy load
- Legal pages — Privacy Policy, Terms of Use, Member Agreement
- About page
- Footer newsletter form wired to Brevo
- Mobile testing — ongoing concurrently with development (app is tested
  on live vimarkets.ca, not localhost)

### 🔴 Beta Blockers
- Market Event Pages — individual public pages per event (scoped, not built)
  — needed before upcoming events on Market Organizer Profile can link anywhere
- Admin calendar tab — admin cannot yet add/edit/delete events
- **Location permission prompt fires too early** — browser asks for location
  before the page even loads (triggers when typing vimarkets.ca in address bar).
  Fix: replace automatic geolocation request with a deliberate user-triggered
  "Set my location" button. Do not fire `navigator.geolocation` on mount.

### 🔴 Pre-Beta (before inviting anyone)
- TypeScript warnings — App.tsx:324, ProfileManager.tsx:211
- Clear all test/placeholder data from Firestore
- Navigation props cleanup (onNavigate/onBack still passed to child components)
- Legal links in signup Step 2 — still use onNavigate(), need Link components
- Email verification on signup — not yet implemented
- **Brevo profile update sync** — when vendor/market updates their types in
  ProfileManager, sync VENDOR_TYPES/MARKET_TYPES to Brevo (registration sync
  is done; profile-edit sync is not)

### 🟡 Near Term
- Profile layout polish — both vendor and market profiles have dead space
- Social links (Instagram, Facebook, Etsy, website, TikTok, Other) —
  not yet in profile form or display; needed before beta
- Star ratings — to be removed from review display (keep on review form)
- Back links on profiles — to be removed (browser back works)
- "Origin Story" → rename to "What's your story?" with ~150 word limit
- Remove Sustainability Practices field from vendor profile
- Vendor types — group with Farm / Artisan headings in profile manager
- Various ProfileManager text/label fixes
- City field normalization
- Client-side image resizing on upload

---

## Known Issues / Watch List

- **Storage rules:** Current state uncertain — verify `storage.rules` before
  assuming any fixes are needed. Prior review flagged missing ownership check
  on uploads and possible unauthenticated read issue, but some fixes may have
  already been applied. Always read the file first.
- **Token name contamination:** `brand-blue`, `brand-gold`, `brand-light-blue`
  don't match their actual colours — see Design Tokens section. Cleanup is a
  post-beta task; do not rename tokens mid-codebase until a full refactor is done.
- **Location prompt fires too early** — geolocation request triggers before
  page loads. Fix: user-triggered "Set my location" button (see Beta Blockers).
- **4-second post-signup refetch delay** in App.tsx onSignupSuccess —
  intentional timing hack to allow logo upload to complete before hub renders.
  Replace with event-driven approach post-beta.
- **organizerAccounts collection** — Phase 2 only; avoid duplicating
  subscription fields already in `users` collection.
- **Footer lives in App.tsx** — not a separate component.
- **vercel.json must live in `frontend/`** — not project root.
- **localhost dev** not used — testing happens on live vimarkets.ca.
- **isAdmin() Firestore rule** costs one extra read per evaluation —
  upgrade to custom claims before scaling.
- **Logout is instantaneous** — this is correct React/Firebase behaviour,
  not a bug. Firebase Auth logout is synchronous and React re-renders
  immediately. No fix needed.

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

## Phase Roadmap

- **Phase 1 (current):** Directory, profiles, organizer hub, event calendar,
  social links on profiles, Market Event Pages
- **Phase 2:** Stripe payments, vendor application system,
  application manager, featured slot booking, organizer accounts
- **Phase 3:** AI Concierge feature (`AIConcierge.tsx` exists as a stub —
  do not build out until Phase 3 is scoped), advanced application management,
  professional association features, cooperative/revenue sharing

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/App.tsx` | Root component, routing, global state, footer |
| `frontend/types.ts` | All TypeScript interfaces + taxonomy constants |
| `frontend/utils.ts` | General utility functions (formatTime, getDistance, etc.) |
| `frontend/utils/slugify.ts` | Slug generation for profile URLs |
| `frontend/services/api.live.ts` | Live API calls to Express backend |
| `frontend/services/api.ts` | Mock API (dev/testing only) |
| `frontend/services/firebase.ts` | Firebase init (Auth + Storage only — no Firestore) |
| `frontend/services/storageUpload.ts` | Firebase Storage upload helpers |
| `frontend/data/mockData.ts` | Test/mock data — not used in production |
| `frontend/components/App.tsx` | Root component |
| `frontend/components/HomePage.tsx` | Homepage with search/filter |
| `frontend/components/MarketProfile.tsx` | Public market profile page |
| `frontend/components/VendorProfile.tsx` | Public vendor profile page |
| `frontend/components/ProfileManager.tsx` | Edit profile (market + vendor) |
| `frontend/components/OrganizerHub.tsx` | Organizer dashboard at /dashboard/my-market |
| `frontend/components/MarketEventForm.tsx` | Add/edit market events |
| `frontend/components/CalendarView.tsx` | Public calendar |
| `frontend/components/AdminPanel.tsx` | Admin HQ |
| `frontend/components/SignupPage.tsx` | Signup wizard |
| `frontend/components/Header.tsx` | Site header + nav |
| `frontend/components/BrowsePage.tsx` | Browse markets / browse vendors |
| `frontend/components/Dashboard.tsx` | User dashboard |
| `backend/src/index.ts` | Express app entry point |
| `backend/src/firebase.ts` | Firebase Admin SDK init |
| `backend/src/routes/users.ts` | User creation, Brevo sync |
| `backend/src/routes/markets.ts` | Market CRUD |
| `backend/src/routes/vendors.ts` | Vendor CRUD |
| `backend/src/routes/marketEvents.ts` | Market event CRUD |
| `backend/src/routes/brevo.ts` | Brevo API integration |
| `backend/src/types/models.ts` | Backend TypeScript types |
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Firebase Storage security rules |
