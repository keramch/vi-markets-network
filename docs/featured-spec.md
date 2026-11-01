# Featured placement spec

Spec locked July 2, 2026. Not built (tracker T021). Today `isFeatured` exists on the frontend Vendor and Market types, and `featuredUntil` and `impressionCount` appear only in the protected-field list in `backend/src/utils/listingAccess.ts`.

## What it is

- **Eligibility:** any member, Free or Pro.
- **Acquisition:** self-serve Stripe checkout (mirrors the Pro flow), or admin grants it manually for gifting or rewarding (mirrors the `foundingMember` override).
- **Duration and price:** monthly only, $10 CAD/month introductory rate. Revisit once real traffic data exists.

## Included

- Boosted ranking in Browse and search results.
- Priority placement within category filter results.
- Homepage rotation: a true random draw of the pool on every page load, no cap on how many members can hold Featured.
- Site-wide Spotlight toast or carousel with honest "Spotlight: [name], [type] in [city]" framing. Do not style it as real-time social proof (no "someone just viewed/bought this"). Once or twice per session, dismissible, non-blocking.

## Excluded

- **Card badge:** dropped deliberately. Kera's reasoning: badge value is only at the discovery stage, irrelevant once someone is on the profile page.
- **Newsletter mention:** dropped for now because no newsletter exists yet (tracker T029).

## Impression stats

A simple running total, not broken down by surface. Visible to the vendor or market on their own dashboard ("Your Featured listing was shown X times this month") and to admin as a summary across all Featured listings. This is also the answer to "why pay for a rotating pool with no visibility guarantee": real numbers replace a vague promise.

## Build order

One isolated Claude Code session each, commit between each.

1. Data model: `isFeatured`, `featuredUntil`, `impressionCount` on User, Vendor and Market types, plus an admin HQ manual grant/revoke toggle. Testable without Stripe.
2. Stripe self-serve checkout ($10/mo). Webhook sets `isFeatured` and `featuredUntil` on payment success.
3. Shared impression-tracking endpoint that increments `impressionCount`. Build before the display pieces so each can call it.
4. Homepage rotation component (logs an impression on render).
5. Browse and search ranking boost plus category filter priority (logs an impression).
6. Site-wide Spotlight toast component (logs an impression).
7. Impression stats on the vendor and market dashboard, plus the admin summary.

The hidden promo banner in the code is marked HIDDEN so it can be restored for this build.
