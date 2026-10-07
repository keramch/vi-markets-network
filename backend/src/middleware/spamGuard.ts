import { Request, Response, NextFunction } from "express";

// ── Spam guard: honeypot + timing check ──────────────────────────────────────
// Pairs with frontend/components/SpamGuard.tsx. A submission is treated as a
// bot if the hidden honeypot field was filled in, or the form was submitted
// faster than a person could fill it in. Bots get `botResponse` (usually a fake
// success, so they don't learn they were caught) and nothing is sent or saved.
// Requests without the fields (older cached pages, direct API calls) pass
// through — those are covered by rate limits and the routes' own checks.

const HONEYPOT_FIELD = "contact_me_by_fax_only";
const MIN_FORM_MS = 3000;

export function spamGuard(botResponse: { status: number; body: Record<string, unknown> }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const trap = body[HONEYPOT_FIELD];
    const elapsed = Number(body.formElapsedMs);

    // Never let these fields reach the route handlers or the database
    delete body[HONEYPOT_FIELD];
    delete body.formElapsedMs;

    const filledTrap = typeof trap === "string" && trap.trim() !== "";
    const tooFast = Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FORM_MS;

    if (filledTrap || tooFast) {
      console.warn(
        `Spam guard blocked ${req.method} ${req.originalUrl} from ${req.ip}` +
        ` (${filledTrap ? "honeypot filled" : `submitted in ${elapsed}ms`})`
      );
      return res.status(botResponse.status).json(botResponse.body);
    }
    next();
  };
}
