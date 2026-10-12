import { computeTotals, formatAmount, lineTotal, type Proposal } from "@/lib/proposal";

const dateFmt = (iso: string, lang: "fr" | "en") => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return lang === "fr" ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
};

const T = {
  fr: {
    proposal: "PROPOSITION",
    number: "N°",
    date: "Date",
    validUntil: "Valable jusqu'au",
    preparedFor: "Préparé pour",
    description: "Description",
    qty: "Qté",
    unitPrice: "Prix unitaire",
    lineTotal: "Total",
    subtotal: "Sous-total",
    tax: (rate: number) => `Taxe (${rate} %)`,
    total: "Total",
    deposit: (pct: number) => `Acompte à la signature (${pct} %)`,
    terms: "Conditions",
    accepted: "ACCEPTÉE",
    declined: "DÉCLINÉE",
  },
  en: {
    proposal: "PROPOSAL",
    number: "No.",
    date: "Date",
    validUntil: "Valid until",
    preparedFor: "Prepared for",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit price",
    lineTotal: "Total",
    subtotal: "Subtotal",
    tax: (rate: number) => `Tax (${rate}%)`,
    total: "Total",
    deposit: (pct: number) => `Deposit due on signature (${pct}%)`,
    terms: "Terms",
    accepted: "ACCEPTED",
    declined: "DECLINED",
  },
} as const;

export default function ProposalSheet({ proposal }: { proposal: Proposal }) {
  const { freelancer: f, client: c, lang, currency } = proposal;
  const t = T[lang];
  const totals = computeTotals(proposal.lines, proposal.taxRate, proposal.depositPercent);
  const fmt = (cents: number) => formatAmount(cents, currency, lang);
  const statusLabel =
    proposal.status === "accepted" ? t.accepted : proposal.status === "declined" ? t.declined : "";

  return (
    <article className="sheet" aria-label={`${t.proposal} ${proposal.number}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold">
            {f.name || (lang === "fr" ? "Votre nom" : "Your name")}
          </p>
          {f.tagline && <p className="text-sm italic">{f.tagline}</p>}
          <p className="whitespace-pre-line">{f.address}</p>
          {(f.phone || f.email || f.website) && (
            <p>{[f.phone, f.email, f.website].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-wide">{t.proposal}</h2>
          <p className="font-mono">
            {t.number} {proposal.number}
          </p>
          <p>
            {t.date}: {dateFmt(proposal.issueDate, lang)}
          </p>
          {proposal.validUntil && (
            <p>
              {t.validUntil}: {dateFmt(proposal.validUntil, lang)}
            </p>
          )}
          {statusLabel && (
            <p className="mt-1 inline-block -rotate-3 border-2 border-[#2b6cb0] px-2 py-0.5 font-bold tracking-widest text-[#2b6cb0]">
              {statusLabel}
            </p>
          )}
        </div>
      </header>

      <section className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider">{t.preparedFor}</p>
        <p className="font-bold">{c.name || (lang === "fr" ? "Nom du client" : "Client name")}</p>
        {c.company && <p>{c.company}</p>}
        <p className="whitespace-pre-line">{c.address}</p>
      </section>

      {proposal.title && <h3 className="mt-5 text-lg font-bold">{proposal.title}</h3>}
      {proposal.intro && <p className="mt-2 whitespace-pre-line">{proposal.intro}</p>}

      <table className="mt-5">
        <thead>
          <tr>
            <th>{t.description}</th>
            <th className="num">{t.qty}</th>
            <th className="num">{t.unitPrice}</th>
            <th className="num">{t.lineTotal}</th>
          </tr>
        </thead>
        <tbody>
          {proposal.lines.map((l) => (
            <tr key={l.id}>
              <td>{l.description}</td>
              <td className="num">{l.quantity}</td>
              <td className="num">{fmt(l.unitPriceCents)}</td>
              <td className="num">{fmt(lineTotal(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-full max-w-72 space-y-1">
        <div className="flex justify-between">
          <dt>{t.subtotal}</dt>
          <dd className="num">{fmt(totals.subtotal)}</dd>
        </div>
        {proposal.taxRate > 0 && (
          <div className="flex justify-between">
            <dt>{t.tax(proposal.taxRate)}</dt>
            <dd className="num">{fmt(totals.tax)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold">
          <dt>{t.total}</dt>
          <dd className="num">{fmt(totals.total)}</dd>
        </div>
        {proposal.depositPercent > 0 && (
          <div className="flex justify-between text-sm">
            <dt>{t.deposit(proposal.depositPercent)}</dt>
            <dd className="num">{fmt(totals.deposit)}</dd>
          </div>
        )}
      </dl>

      {(proposal.paymentTerms || proposal.notes) && (
        <section className="mt-5 border-t border-dashed border-black pt-2">
          <p className="text-xs font-bold uppercase tracking-wider">{t.terms}</p>
          {proposal.paymentTerms && (
            <p className="mt-1 whitespace-pre-line">{proposal.paymentTerms}</p>
          )}
          {proposal.notes && <p className="mt-2 whitespace-pre-line text-xs">{proposal.notes}</p>}
        </section>
      )}
    </article>
  );
}
