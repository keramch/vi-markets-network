import React, { useRef, useState } from 'react';

// ── Spam guard: honeypot field + timing check ────────────────────────────────
// Bots fill in every field they find and submit instantly. People never see
// the honeypot field and take more than a few seconds to fill in a form.
// The backend (middleware/spamGuard.ts) quietly discards submissions that
// fill in the honeypot or arrive too fast. No CAPTCHA, nothing for people to do.

// Deliberately obscure name so browser autofill never fills it in
export const HONEYPOT_FIELD = 'contact_me_by_fax_only';

export interface SpamGuardFields {
  contact_me_by_fax_only?: string;
  formElapsedMs?: number;
}

export function useSpamGuard() {
  const startedAt = useRef(Date.now());
  const [trapValue, setTrapValue] = useState('');

  // Off-screen rather than display:none — some bots skip display:none fields
  const honeypotField = (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
    >
      <label>
        Leave this field empty
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={trapValue}
          onChange={(e) => setTrapValue(e.target.value)}
        />
      </label>
    </div>
  );

  // Extra fields to send with the form submission. Elapsed time is measured
  // on the device itself, so a wrong clock on the visitor's computer can't trip it.
  const guardFields = (): SpamGuardFields => ({
    [HONEYPOT_FIELD]: trapValue,
    formElapsedMs: Date.now() - startedAt.current,
  });

  return { honeypotField, guardFields };
}
