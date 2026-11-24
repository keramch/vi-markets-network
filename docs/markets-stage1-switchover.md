# Stage 1 switch-over checklist (T128)

The steps for putting stage 1 live: markets as their own listings, organizers renamed, the data conversion. The plan and its reasons are in `docs/markets-stage1-spec.md`. Written Nov 24, 2026.

**Who does what:** Kera pushes and clicks through. Claude Code runs the conversion and the checks. We do it together, at a quiet hour (late evening is best).

**Expect about 5–10 minutes of errors.** They run from the push until the conversion finishes. Nothing is lost.

---

## Before the day (Kera, any time)

1. **Brevo:** any segment or automation that looks for MEMBERTYPE "Market" should look for "Market **or** Organizer". This is harmless to do early.
2. **Don't push `dev` until the switch-over.** The new pages need the new server, so the dev preview would show errors until then.

## On the day

| # | Who | Step | How we know it worked |
|---|---|---|---|
| 1 | Claude | Run a fresh **dry run** against the live data (reads only). | "Problems: none" |
| 2 | Claude | Merge `dev` into `main` locally. | `main` has the stage 1 commits |
| 3 | Kera | `git push origin dev main` | Vercel builds two, Render builds one |
| 4 | Kera | Publish the rules, from the project folder in PowerShell: `firebase deploy --only "firestore:rules,storage" --project vi-markets-fa746` | "Deploy complete!" |
| 5 | Kera | Watch Render until the new commit shows **Live** (about 5 minutes). | Render dashboard |
| 6 | Claude | Run the conversion: it backs everything up first, then converts. | "Applied 104 writes" (or close: the count changes if anything was added since) |
| 7 | Claude | Read-back checks (read-only): `/markets`, `/organizers`, a few market pages, old links, link previews. | Every check passes |
| 8 | Kera | Click through the site (list below). | It all looks right |

### Kera's click-through
- **Home page:** Coming up shows Bilston Farm Yuletide Market, Cumberland Winterfaire and Toy & Craft Market. What's New shows markets.
- **Markets (Browse):** all the markets, soonest first, the unclaimed ones included.
- **A market page,** e.g. River City Christmas Market:
  - "Date from a vendor";
  - "Times to be confirmed";
  - the vendors who'll be there;
  - "Is this your market?";
  - Save.
- **An old link:** `vimarkets.ca/markets/cumberland-museum/cumberland-winterfaire-2026` opens Cumberland Winterfaire's new page.
- **An organizer page:** `vimarkets.ca/organizers/cumberland-museum`, which has Follow.
- **Calendar:** November and December show the markets.
- **HQ › Unclaimed markets:** the list, then Edit on one (the market form opens). Save a small change and check it.
- **As a vendor** (test account): add a market you attend that isn't listed. It appears as an unclaimed market.
- **As an organizer** (test account): My Markets lists their markets, and you can add one.

## If something's badly wrong

1. Claude runs the **undo**. It restores every touched collection from the backup.
2. Claude puts `main` back to the commit before stage 1, and Kera pushes `main`.
3. Republish the old rules from that commit (step 4 again).

Anything entered on the site after step 6 would need re-entering.

## After it's settled (a few days later)

- **Brevo:** remove "Market" from the segments.
- **Clean-up:** delete the backup collections (`stage1Backup_*`) and the old `marketEvents` collection, once Kera's happy. Claude can do it with her OK.
- **Records:** update the tracker (T128, T129, T133) and the log.
