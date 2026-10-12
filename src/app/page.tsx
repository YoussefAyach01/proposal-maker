import Link from "next/link";

const sample = [
  ["Website design & build", "1", "25 000,00"],
  ["Monthly maintenance (3 mo.)", "3", "1 200,00"],
];

export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <p className="font-mono text-sm text-muted">FR · EN · MAD · EUR · USD · GBP</p>
      <div className="mt-4 grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Send a proposal that looks like you charge enough.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Line items, taxes, a deposit if you take one, and your terms — laid out on a clean page
            your client can read in thirty seconds. Pick French or English per proposal, preview it
            live, export to PDF, done.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="btn inline-flex items-center">
              Create my first proposal
            </Link>
          </div>
          <ul className="mt-6 space-y-1 text-muted">
            <li>No account: your data stays in your browser.</li>
            <li>Automatic numbering: 2026-0001, 2026-0002…</li>
            <li>Optional tax rate and deposit percentage, your own payment terms.</li>
          </ul>
        </div>
        <div className="sheet" aria-label="Sample proposal">
          <div className="flex justify-between">
            <strong>PROPOSAL 2026-0001</strong>
            <span className="font-mono text-xs">Valid until 11/30/2026</span>
          </div>
          <table className="mt-4">
            <thead>
              <tr>
                <th>Description</th>
                <th className="num">Qty</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {sample.map(([d, q, total]) => (
                <tr key={d}>
                  <td>{d}</td>
                  <td className="num">{q}</td>
                  <td className="num">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="num mt-3 font-bold">Total: 28 600,00 MAD</p>
          <p className="mt-3 border-t border-dashed border-black pt-2 text-xs italic">
            Deposit due on signature (30%): 8 580,00 MAD
          </p>
        </div>
      </div>
      <p className="mt-12 text-sm text-muted">
        Proposal Maker helps you lay out a quote clearly; it is not legal or tax advice. Check your
        own country&apos;s invoicing/VAT rules before billing a client for real.
      </p>
    </main>
  );
}
