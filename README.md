# proposal-maker

A local-first tool for freelancers to write client proposals/quotes (line items, pricing, taxes, deposit,
payment terms), preview them live, and export to PDF via the browser's own print dialog — in French or
English, per proposal. No account, no server-side storage: everything lives in the browser's localStorage,
the same approach as `invoice-ma`.

Stack: Next.js 16 (App Router) + Tailwind 4 + TypeScript strict. No database, no auth, no API routes.

## Run

```bash
npm install
npm run dev      # http://localhost:3520
```

Checks: `npm run typecheck && npm run lint && npm test`.
End-to-end (real Chrome, needs `npm run build` first): `npm run test:e2e`.

## How it is built

- `src/lib/proposal.ts`: pure logic — integer-cent math, per-line totals, tax and deposit calculation,
  amount parsing/formatting in French (`1 250,50 MAD`) or English (`$1,250.50`) style, sequential numbering
  (`2026-0001`), and field validation that returns a bilingual message per problem. Unit-tested without
  Next or React.
- `src/components/Studio.tsx`: the editor (client component — reads/writes `localStorage`). Every field
  edit patches the current proposal and re-saves the whole list; a `details` panel holds the freelancer's
  own profile (reused across proposals). The document's language (`fr`/`en`) drives both the editor's own
  labels and the live preview, so switching it is one dropdown, not two separate UIs.
- `src/components/ProposalSheet.tsx`: the printable A4-shaped preview, rendered from the exact same
  `Proposal` object the editor is mutating — what you see is what gets printed. All user text is rendered
  through React (never `dangerouslySetInnerHTML`), so it's HTML-escaped by construction (checked in tests).
- `src/components/StudioLoader.tsx`: a `next/dynamic` wrapper with `ssr: false`, because the Studio reads
  `localStorage` and can't render on the server.
- Export is "print to PDF": clicking the button validates the proposal, switches to the preview tab, and
  calls `window.print()` — the user picks "Save as PDF" in the browser's own print dialog. A dedicated
  `@media print` stylesheet hides all editor chrome (`.no-print`) and fixes the sheet to A4.
- Security: no CSP `unsafe-eval`, strict headers in `next.config.ts`, `noValidate` + explicit field
  validation (rather than relying on the browser's native message, which isn't localized or testable).

## Deploy

Static-ish: no database or server state at all, so any Next.js host works, including Vercel.

1. `npm run build && npm start`, or deploy to Vercel/any Node host.
2. No env vars are required (`.env.example` only documents an optional analytics URL).
3. There is nothing to back up server-side: all data lives in each freelancer's own browser. Tell users
   that clearing site data or switching browsers/devices loses their saved proposals — there's no sync.

## Known limits

- No account, no sync across devices/browsers — this is a deliberate scope cut (see `BUSINESS.md`), not a
  bug. A paid tier with sync would need a real backend.
- No logo upload (text-only header).
- No e-signature; "accepted/declined" status is set manually by the freelancer after the fact.
- No currency conversion: picking EUR/USD/GBP only changes the symbol and formatting, not real exchange
  rates.
- Print-to-PDF depends on the browser's print dialog; the exact PDF margins can vary slightly between
  browsers (tested on headless Chrome only).
