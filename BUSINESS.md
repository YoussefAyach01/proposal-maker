# proposal-maker: business one-pager

## Buyer and problem

Freelancers and small agencies (designers, developers, consultants, photographers) who currently write
quotes in Word/Google Docs/Canva or just a WhatsApp message with a price. That looks unprofessional next to
a client who is comparing several providers, and re-typing the same line items and terms for every client
wastes time. They want a quote that looks considered — line items, a clear total, their terms — in two
minutes, without learning an invoicing SaaS meant for recurring billing.

## Offer and pricing

| Plan                            | MAD / month | USD / month | Includes                                                                        |
| ------------------------------- | ----------- | ----------- | ------------------------------------------------------------------------------- |
| Free (this product, as shipped) | 0           | 0           | Unlimited proposals, FR/EN, PDF export, local-only                              |
| Hypothetical "Pro" (not built)  | 49          | 5           | Account + sync across devices, logo upload, PDF via server (consistent margins) |

Realistic framing: this is a **lead magnet / portfolio piece**, not primarily a standalone paid SaaS at this
scope — the free local-first version does everything most freelancers need. The honest monetisation path is
either (a) selling it as a done-for-you tool bundled with `agency-kit`-style freelance consulting, or (b)
building the "Pro" sync tier later if freelancers ask for it, which would need real accounts and a backend
(see Honest limits).

## First 5 customers

1. Freelance Moroccan developers/designers (Discord/Telegram/Facebook groups for freelancers in Morocco):
   share it as a free tool, not a sales pitch — goodwill and visibility matter more than a sale here.
2. Anyone who already asked "do you have a quote template?" in past client conversations — a direct,
   personal share costs nothing and tests real demand.
3. Bundle a mention of it into `agency-kit`'s outreach materials (already built for site-kit sales): "I also
   give away a free proposal tool" is a credibility signal when pitching website work.

## Accounts needed to go live

- None for the code itself: it's a static-ish Next.js app, deployable to Vercel for free.
- A domain if Youssef wants a memorable URL instead of the default Vercel one (~100 MAD/year).
- Only if the paid "Pro" sync tier is ever built: a database/auth provider and a payment gateway.

## Honest limits

- This does not out-compete real invoicing/CRM tools (Bonsai, HoneyBook, invoice-ma's own future Pro tier)
  for freelancers who need recurring billing, e-signatures or client portals — it intentionally does less,
  in exchange for being usable in two minutes with zero setup.
- No real evidence yet that freelancers will pay for this specifically; the pricing table above is a
  placeholder for if that changes, not a validated plan.
- Local-first means no sync and no account recovery: losing browser data loses the proposals. This must be
  stated plainly wherever the tool is shared.
- Not tested on Safari/iOS or real phones; verified with real headless Chrome (desktop) at 375px, via the
  jsdom component tests, and via an automated end-to-end flow on real Chrome (playwright-core) covering
  creating a proposal, live totals, the French/English language switch, validation blocking export, the
  print/export call itself (stubbed, since a real OS print dialog can't be driven headlessly), and data
  surviving a reload.
