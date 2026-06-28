

**VI Markets Network**

Master Architecture & Product Design Document

Phase 2 — February 2026

*Confidential — Internal Planning Document*

# **1\. Project Overview**

VI Markets Network is a directory and management platform for Vancouver Island farmers markets and vendors. The platform serves three primary audiences: market visitors browsing local markets and vendors, vendors seeking market opportunities and managing their presence, and market organizers managing their events, applications, and vendor relationships.

The platform is built on a React/TypeScript frontend (Vite), Node.js/TypeScript backend, and Firebase/Firestore database. Hosting targets Vercel (frontend) and Railway (backend) for production.

# **2\. System Actors**

The following actor types exist in the system. All actors except Visitor require a Firebase Auth account.

## **2.1 Visitor (Unauthenticated)**

* Browse market listings, vendor profiles, and calendar events

* View market and vendor public profiles

* Use share buttons on listings

* No account required

## **2.2 Vendor**

* Paid account required to apply to markets (Free tier: browse only)

* Maintains a vendor profile with product categories, photos, bio, social links

* Browses and applies to open market applications

* Views confirmed market attendance on their profile

* Receives notifications on application status changes

* Can also be an Organizer (common — e.g. a farm that hosts on-farm markets)

## **2.3 Market Organizer**

* Manages one or more Market Pages under their account

* Creates and manages market listings with scheduling options

* Publishes market applications (juried or open registration)

* Reviews vendor applications, manages waitlists

* Sends acceptance/rejection notices through the platform

* Can invite a Co-Manager (collaborator) to share management of a Market Page

* Billing and subscription held at Organizer account level

## **2.4 Admin**

* Super Admin (owner): full system access, billing, all regions

* Regional Admin: moderation and support for their local area

* Access to Market HQ admin panel

* Can manage all users, listings, reviews, and content

## **2.5 Advertiser (Future)**

Reserved role for future third-party advertiser accounts. User type field should include this as a valid value from day one to avoid schema migration later. No functionality to be built in Phase 2\.

# **3\. Data Model & Hierarchy**

## **3.1 Core Hierarchy**

The fundamental data hierarchy is as follows:

**Organizer Account  →  Market Page(s)  →  Market Events/Listings  →  Applications  →  Vendor Confirmations**

This hierarchy means:

* One Firebase Auth account can own multiple Market Pages

* Each Market Page is an independent Firestore document with its own profile, branding, and schedule

* Each Market Page can have multiple Events (one-time or recurring series)

* Each Event can have an Application attached (juried or open)

* Accepted vendors appear on both the Market Page and their own Vendor Profile

## **3.2 Firestore Collections**

| Collection | Key Fields | Notes |
| :---- | :---- | :---- |
| users | uid, email, userType, role, subscription, createdAt | userType: vendor | organizer | both | admin | advertiser |
| vendorProfiles | uid, businessName, categories, bio, photos, socialLinks | One per vendor user |
| organizerAccounts | uid, orgName, subscription, marketPageIds\[\] | Links to market pages |
| marketPages | id, organizerUid, name, location, bio, photos, facebookLink, externalEventLink, coManagerUids\[\] | One per market brand |
| marketEvents | id, marketPageId, type, recurrenceRule, startDate, endDate, exceptions\[\], location, time, tags | One-time or recurring series |
| marketApplications | id, marketEventId, type (juried|open), capacity, deadline, categories, customFields, status | Attached to an event |
| vendorApplications | id, applicationId, vendorUid, status (pending|accepted|rejected|waitlisted), submittedAt, prefillSnapshot | Vendor's submission |
| reviews | id, authorUid, targetUid, targetType, rating, body, approved, createdAt | Vendor→Market or Market→Vendor |
| notifications | id, recipientUid, type, channel, read, createdAt, payload | In-app; email/push triggered separately |
| waitlistEntries | id, applicationId, vendorUid, position, categories, holdExpiresAt | Managed manually by organizer |

## **3.3 Recurrence Model**

Market events follow a series \+ exceptions pattern — consistent with how Google Calendar handles recurring events. This avoids storing dozens of individual date documents for a weekly market.

* A recurring market stores one document with a recurrenceRule (e.g. every Saturday, May–October)

* Individual date exceptions (cancellations, modified times) are stored as an exceptions\[\] array on the series document

* One-off special events are separate Event documents linked to the same Market Page

* The frontend generates the actual date instances from the recurrence rule when rendering the calendar

# **4\. Pricing & Subscription Tiers**

Vendors and Organizers share a parallel tier structure. This keeps billing simple and the value proposition easy to communicate. A 25% annual discount applies across all paid tiers. The Founding Member offer (limited time) provides a permanent discount for early adopters.

## **4.1 Vendor Tiers**

| Tier | Price/mo | Price/yr | Market Applications/month | Notifications | Best For |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Free | $0 | $0 | Browse only | In-app only | Just getting started |
| Standard | $5 | $45 | 3 | In-app \+ Email | Active vendors, one regular circuit |
| Pro | $12 | $108 | 10 | In-app \+ Email \+ Push | Busy vendors, multiple markets |
| Super Pro | $24 | $216 | Unlimited | All channels incl. SMS | Large operations, agencies |

## **4.2 Organizer Tiers**

| Tier | Price/mo | Price/yr | Active Listings | Notifications | Best For |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Free | $0 | $0 | 1 | In-app only | Once-a-year events |
| Standard | $5 | $45 | 3 | In-app \+ Email | Small organizers, one regular market |
| Pro | $12 | $108 | 10 | In-app \+ Email \+ Push | Active organizers, multiple markets |
| Super Pro | $24 | $216 | Unlimited | All channels incl. SMS | Market societies, large operations |

**Notes on tiers:**

* 'Active listing' \= a published market event currently visible on the platform

* Standard organizers: one recurring market \+ occasional layered one-off events on the same market counts as one listing

* Pro/Super Pro organizers can have multiple independent Market Pages

* SMS notifications are a Super Pro-only feature (cost recovery rationale)

* Template customization for acceptance/rejection notices is a Pro+ feature

* Co-manager invitations available on Standard and above

# **5\. Calendar System**

## **5.1 Market Event Types**

| Type | Description |
| :---- | :---- |
| Recurring | Weekly, biweekly, or monthly market running across a date range (e.g. every Saturday May–Oct) |
| One-Time | Single-date event (e.g. Christmas market, pop-up) |
| Special Edition | A layered override on a recurring series (e.g. special holiday edition with different hours) |
| Exception / Cancellation | A specific date within a series marked as cancelled or modified |

## **5.2 Market Listing Fields**

Each published market listing displays the following information publicly:

* Market name and logo/photo

* Host / organizer name (links to organizer profile)

* Venue name and address / location

* Date(s) and time(s)

* Market type / tags (e.g. Farmers Market, Artisan, Night Market, Pop-Up)

* Link to full Market Page profile

* Optional: Facebook Event link or external event URL

* Confirmed vendor list (names \+ logos, links to vendor profiles)

* Share button

## **5.3 Calendar View**

The public calendar displays a monthly grid. Weekend days (Saturday and Sunday) render larger than weekdays, reflecting the fact that most markets occur on weekends. Visitors can filter by region, market type, and date range. A scrollable agenda/list view is also provided as an alternative display mode.

## **5.4 Calendar Export**

Visitors and vendors can add any market listing to their personal calendar via a standard .ics file download or 'Add to Google Calendar' link. This is generated on-demand from the event data and requires no third-party calendar integration. Organizers do not need to connect external calendars — all scheduling is managed within the platform.

## **5.5 Organizer Submission Flow**

The goal is to make event creation take under 60 seconds for the common case (a weekly recurring market). The form is designed around smart defaults:

* Location pre-filled from Market Page profile

* Market name and photo pre-filled

* Recurrence picker: weekly / biweekly / monthly, which day(s), what time, seasonal date range

* 'Add exceptions or one-off events' expands only if needed

* Separate '+Add One-Time Event' button for special dates

# **6\. Market Applications System**

## **6.1 Overview**

The applications system functions as a job board for market vendors. Organizers publish open calls for vendors; vendors browse and apply; accepted vendors are confirmed and appear on both the market listing and their own vendor profile. This closes the full loop of the platform ecosystem.

## **6.2 Application Types**

### **Juried Markets**

* Organizer accepts unlimited applications until their set deadline

* No payment collected at application stage

* Organizer reviews submissions, selects vendors, and sends acceptance notices through the platform

* Accepted vendors receive a payment link or instructions (external — market's own payment system)

* Rejected vendors receive a rejection notice

* Organizer gets milestone notifications (e.g. at 50, 100 applications received)

### **Open / Non-Juried Markets**

* Organizer sets a hidden capacity (number of spaces)

* Registrations fill spots in order received

* When capacity is reached, new applicants automatically go to a waitlist

* Organizer receives an alert at approximately 80% capacity

* Public display shows 'Spaces Available' or 'Waitlist Only' — no actual numbers shown

* Organizer manually works the waitlist (see Section 6.4)

## **6.3 Application Template**

All applications use a standard template with optional extensions:

* Pre-filled from vendor profile: business name, product categories, bio, photos, contact info

* Standard fields: which dates applying for, booth size preference, any special requirements

* Optional organizer-added fields: custom questions, additional photo requests

* Organizer can save custom templates to reuse across market seasons

## **6.4 Waitlist Management**

The waitlist queue is visible only to the organizer. Key features:

* Ordered by submission time (default)

* Filterable by vendor category and application date

* Organizer manually selects from waitlist to fill vacancies (preserving category balance)

* When invited from waitlist: system sends notification and holds the spot for a time-limited period

* Hold duration: 72 hours if market date is more than 7 days away; 24 hours if within 7 days

* Hold duration is automatically calculated by the system — no manual input required

* If vendor does not confirm within hold period, spot passes to next on waitlist

## **6.5 Vendor Notifications on Application Status**

| Event | Notification |
| :---- | :---- |
| Application submitted | Confirmation to vendor |
| Accepted (juried) | Acceptance notice \+ payment instructions |
| Rejected (juried) | Rejection notice (boilerplate, customizable on Pro+) |
| Registered (open) | Confirmation \+ any relevant details |
| Added to waitlist | Waitlist confirmation with position |
| Invited from waitlist | Invitation notice with hold deadline |
| Hold expired | Notification that spot was released |

## **6.6 Acceptance / Rejection Notices**

Phase 1 (all tiers): The platform sends a standardized, professionally worded notice when an organizer accepts or rejects a vendor. No configuration needed.

Phase 2 (Pro and Super Pro): Organizers can customize their acceptance and rejection message templates using merge fields. Available merge fields include: {vendorName}, {marketName}, {marketDate}, {paymentLink}, {organizerName}, {deadline}. Templates are saved per Market Page and reused across seasons.

# **7\. Vendor Profiles & Cross-Linking**

Vendor profiles display a 'Markets I Attend' section listing confirmed market appearances — market name, date(s), and a link to the market page. This is automatically populated when a vendor is confirmed for a market.

Market Pages display a 'Confirmed Vendors' section listing accepted vendors for upcoming events — vendor name, logo, and a link to the vendor profile. Both lists are simple linked listings, not full tiled cards.

Reviews are bidirectional: vendors can rate markets (organization quality, foot traffic, value for fees), and markets can rate vendors (reliability, presentation, communication). Reviews require approval before display and contribute to profile credibility. Review scores may factor into search ranking in future versions.

# **8\. Notification System**

| Channel | Availability | Cost | Launch Plan |
| :---- | :---- | :---- | :---- |
| In-app (notification bell) | All tiers | Free | Phase 2 launch |
| Email | Standard and above | Low (Resend/SendGrid) | Phase 2 launch |
| Push (browser) | Pro and above | Free | Shortly after launch |
| SMS | Super Pro only | \~$0.01–0.02/msg (Twilio) | Later phase |

The notification system is built with multiple channels in mind from day one. The underlying notification record in Firestore is channel-agnostic — the delivery mechanism is determined by the recipient's tier and preferences. This avoids refactoring when new channels are added.

# **9\. Deferred Decisions**

The following items were identified during architecture planning but intentionally deferred:

* Google Sign-In: currently 'coming soon' — wire up after core features are stable

* Advertiser role: reserved in schema, no functionality in Phase 2

* Multi-region architecture: placeholder only, revisit after Vancouver Island launch

* AI Concierge feature: exists in code but untested — evaluate post-beta

* Stripe Connect for market fee collection: deferred in favour of organizer-provided payment links

* SMS notifications: Super Pro feature, implement after email and push are stable

* Review ranking signals: collect reviews now, factor into search ranking in a later version

# **10\. Recommended Build Order**

Based on the architecture above, the recommended implementation sequence prioritizes features that unblock other features and deliver the most value to beta users:

| Phase | Items | Why |
| :---- | :---- | :---- |
| 2A — Foundation | Updated data model \+ Firestore schema, pricing tier update (4 tiers), organizer account → market pages hierarchy | Everything else depends on this |
| 2B — Calendar | Market event creation UI, recurrence system, calendar grid view (weekend-larger), .ics export | Core organizer value, needed before applications |
| 2C — Applications | Application template system, juried \+ open flows, vendor apply flow with profile prefill, waitlist management | Core platform loop |
| 2D — Notifications | In-app notification bell, email notifications (Resend/SendGrid), acceptance/rejection notices | Closes the communication loop |
| 2E — Polish | Cross-linking vendor↔market, reviews system, Pro+ template customization, real VI location data | Beta-readiness |
| 2F — Production | Firestore security rules audit, rate limiting, Vercel \+ Railway deploy, Firebase Blaze upgrade, image uploads | Launch readiness |

*VI Markets Network — Confidential Internal Document — February 2026*