"use client";
import { useState } from "react";
import Link from "next/link";
import ProposalSheet from "./ProposalSheet";
import {
  computeTotals,
  formatAmount,
  nextProposalNumber,
  parseAmountToCents,
  validateProposal,
  CURRENCIES,
  type Client,
  type Currency,
  type Freelancer,
  type Lang,
  type Line,
  type Proposal,
  type Status,
} from "@/lib/proposal";
import { loadFreelancer, loadProposals, saveFreelancer, saveProposals } from "@/lib/storage";

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID();

const UI = {
  fr: {
    brand: "Devis",
    newProposal: "Nouvelle proposition",
    myCompany: "Mon activité",
    name: "Nom / activité",
    tagline: "Accroche (facultatif)",
    email: "E-mail",
    phone: "Téléphone",
    website: "Site web (facultatif)",
    address: "Adresse",
    savedLocally: "Enregistré dans ce navigateur uniquement.",
    myProposals: (n: number) => `Mes propositions (${n})`,
    none: "Aucune proposition. Cliquez sur « Nouvelle proposition » pour commencer.",
    noClient: "sans client",
    delete: "Supprimer",
    select: "Sélectionnez une proposition ou créez-en une nouvelle.",
    edit: "Modifier",
    preview: "Aperçu",
    number: "N°",
    status: "Statut",
    draft: "Brouillon",
    sent: "Envoyée",
    accepted: "Acceptée",
    declined: "Déclinée",
    issueDate: "Date d'émission",
    validUntil: "Valable jusqu'au",
    language: "Langue du document",
    currency: "Devise",
    title: "Titre du projet",
    intro: "Introduction (facultatif)",
    client: "Client",
    clientName: "Nom",
    clientCompany: "Société (facultatif)",
    clientEmail: "E-mail (facultatif)",
    clientAddress: "Adresse",
    lines: "Lignes",
    addLine: "Ajouter une ligne",
    removeLine: (n: number) => `Supprimer la ligne ${n}`,
    lineDesc: (n: number) => `Ligne ${n} — description`,
    qty: "Qté",
    unitPrice: "Prix unitaire",
    tax: "Taxe (%)",
    deposit: "Acompte (%)",
    paymentTerms: "Conditions de paiement",
    notes: "Notes",
    export: "Exporter en PDF",
    exportHint: "Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF ».",
    fixErrors: "Corrigez les champs signalés avant d'exporter.",
    saveError: "Enregistrement local impossible (stockage du navigateur bloqué).",
    confirmDelete: "Supprimer cette proposition ? Action définitive.",
  },
  en: {
    brand: "Quotes",
    newProposal: "New proposal",
    myCompany: "My business",
    name: "Name / business",
    tagline: "Tagline (optional)",
    email: "Email",
    phone: "Phone",
    website: "Website (optional)",
    address: "Address",
    savedLocally: "Saved in this browser only.",
    myProposals: (n: number) => `My proposals (${n})`,
    none: 'No proposals yet. Click "New proposal" to start.',
    noClient: "no client",
    delete: "Delete",
    select: "Select a proposal or create a new one.",
    edit: "Edit",
    preview: "Preview",
    number: "No.",
    status: "Status",
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    issueDate: "Issue date",
    validUntil: "Valid until",
    language: "Document language",
    currency: "Currency",
    title: "Project title",
    intro: "Introduction (optional)",
    client: "Client",
    clientName: "Name",
    clientCompany: "Company (optional)",
    clientEmail: "Email (optional)",
    clientAddress: "Address",
    lines: "Lines",
    addLine: "Add a line",
    removeLine: (n: number) => `Delete line ${n}`,
    lineDesc: (n: number) => `Line ${n} — description`,
    qty: "Qty",
    unitPrice: "Unit price",
    tax: "Tax (%)",
    deposit: "Deposit (%)",
    paymentTerms: "Payment terms",
    notes: "Notes",
    export: "Export to PDF",
    exportHint: 'In the print dialog, choose "Save as PDF".',
    fixErrors: "Fix the highlighted fields before exporting.",
    saveError: "Could not save locally (browser storage is blocked).",
    confirmDelete: "Delete this proposal? This cannot be undone.",
  },
} as const;

function newLine(): Line {
  return { id: uid(), description: "", quantity: 1, unitPriceCents: 0 };
}

function newProposal(freelancer: Freelancer, all: Proposal[]): Proposal {
  const d = today();
  const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return {
    id: uid(),
    number: nextProposalNumber(
      all.map((p) => p.number),
      new Date().getFullYear(),
    ),
    lang: "fr",
    currency: "MAD",
    title: "",
    issueDate: d,
    validUntil,
    freelancer,
    client: { name: "", company: "", email: "", address: "" },
    intro: "",
    lines: [newLine()],
    taxRate: 0,
    depositPercent: 0,
    paymentTerms: "",
    notes: "",
    status: "draft",
  };
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "text";
  multiline?: boolean;
  id: string;
}) {
  const { label, value, onChange, error, type = "text", inputMode, multiline, id } = props;
  const common = {
    id,
    value,
    className: "field",
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-err` : undefined,
  };
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea {...common} rows={2} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          {...common}
          type={type}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-stamp">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Studio() {
  const [freelancer, setFreelancer] = useState<Freelancer>(() => loadFreelancer());
  const [proposals, setProposals] = useState<Proposal[]>(() => loadProposals());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [showProblems, setShowProblems] = useState(false);
  const [notice, setNotice] = useState("");

  const current = proposals.find((p) => p.id === currentId) ?? null;
  const t = UI[current?.lang ?? "fr"];

  function commit(next: Proposal[]) {
    setProposals(next);
    if (!saveProposals(next)) setNotice(t.saveError);
  }

  function patch(p: Partial<Proposal>) {
    if (!current) return;
    commit(proposals.map((x) => (x.id === current.id ? { ...x, ...p } : x)));
  }

  function patchFreelancer(p: Partial<Freelancer>) {
    const next = { ...freelancer, ...p };
    setFreelancer(next);
    saveFreelancer(next);
    if (current && current.status === "draft") patch({ freelancer: next });
  }

  function create() {
    const p = newProposal(freelancer, proposals);
    commit([p, ...proposals]);
    setCurrentId(p.id);
    setShowProblems(false);
    setTab("edit");
  }

  function remove(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    commit(proposals.filter((p) => p.id !== id));
    if (currentId === id) setCurrentId(null);
  }

  function updateLine(id: string, p: Partial<Line>) {
    if (!current) return;
    patch({ lines: current.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  }

  function print() {
    if (!current) return;
    setShowProblems(true);
    const problems = validateProposal(current);
    if (problems.length > 0) {
      setNotice(t.fixErrors);
      setTab("edit");
      return;
    }
    setNotice("");
    setTab("preview");
    // Let the preview render before the print dialog opens; choose "Save as PDF".
    setTimeout(() => window.print(), 100);
  }

  const problems = current && showProblems ? validateProposal(current) : [];
  const err = (field: string) =>
    problems.find((p) => p.field === field)?.message[current?.lang ?? "fr"];

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6">
      <header className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-lg font-bold">
          Proposal<span className="text-blue">.maker</span>
        </Link>
        <button className="btn" onClick={create}>
          {t.newProposal}
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <aside className="no-print space-y-4">
          <details className="rounded-lg bg-white p-3" open={!freelancer.name}>
            <summary className="cursor-pointer font-semibold">{t.myCompany}</summary>
            <div className="mt-3 space-y-3">
              <Field
                id="f-name"
                label={t.name}
                value={freelancer.name}
                onChange={(v) => patchFreelancer({ name: v })}
                error={err("freelancer.name")}
              />
              <Field
                id="f-tagline"
                label={t.tagline}
                value={freelancer.tagline}
                onChange={(v) => patchFreelancer({ tagline: v })}
              />
              <Field
                id="f-email"
                label={t.email}
                type="email"
                value={freelancer.email}
                onChange={(v) => patchFreelancer({ email: v })}
              />
              <Field
                id="f-phone"
                label={t.phone}
                type="tel"
                value={freelancer.phone}
                onChange={(v) => patchFreelancer({ phone: v })}
              />
              <Field
                id="f-website"
                label={t.website}
                value={freelancer.website}
                onChange={(v) => patchFreelancer({ website: v })}
              />
              <Field
                id="f-address"
                label={t.address}
                multiline
                value={freelancer.address}
                onChange={(v) => patchFreelancer({ address: v })}
              />
              <p className="text-xs text-muted">{t.savedLocally}</p>
            </div>
          </details>

          <section aria-labelledby="list-h" className="rounded-lg bg-white p-3">
            <h2 id="list-h" className="font-semibold">
              {t.myProposals(proposals.length)}
            </h2>
            {proposals.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t.none}</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {proposals.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-1">
                    <button
                      className="min-h-11 flex-1 text-left"
                      aria-current={p.id === currentId ? "true" : undefined}
                      onClick={() => {
                        setCurrentId(p.id);
                        setShowProblems(false);
                        setTab("edit");
                      }}
                    >
                      <span
                        className={`font-mono ${p.id === currentId ? "font-bold text-blue" : ""}`}
                      >
                        {p.number}
                      </span>{" "}
                      <span className="text-sm text-muted">
                        {p.client.name || t.noClient} ·{" "}
                        {formatAmount(
                          computeTotals(p.lines, p.taxRate, p.depositPercent).total,
                          p.currency,
                          p.lang,
                        )}
                      </span>
                    </button>
                    <button
                      className="btn btn-danger min-h-11 px-3"
                      onClick={() => remove(p.id)}
                      aria-label={`${t.delete}: ${p.number}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <div>
          {!current ? (
            <p className="no-print rounded-lg bg-white p-6">{t.select}</p>
          ) : (
            <>
              <div
                role="tablist"
                aria-label={t.preview}
                className="no-print mb-3 flex gap-2 lg:hidden"
              >
                {(["edit", "preview"] as const).map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={tab === k}
                    className={`btn flex-1 ${tab === k ? "" : "btn-ghost"}`}
                    onClick={() => setTab(k)}
                  >
                    {k === "edit" ? t.edit : t.preview}
                  </button>
                ))}
              </div>
              {notice && (
                <p
                  role="status"
                  className="no-print mb-3 rounded-md border border-stamp bg-white p-3 text-stamp"
                >
                  {notice}
                </p>
              )}
              <div className="grid gap-4 xl:grid-cols-2">
                <form
                  className={`no-print space-y-4 rounded-lg bg-white p-3 ${tab === "edit" ? "" : "hidden lg:block"}`}
                  onSubmit={(e) => e.preventDefault()}
                  noValidate
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      id="p-num"
                      label={t.number}
                      value={current.number}
                      onChange={(v) => patch({ number: v })}
                    />
                    <div>
                      <label htmlFor="p-status" className="mb-1 block text-sm font-semibold">
                        {t.status}
                      </label>
                      <select
                        id="p-status"
                        className="field"
                        value={current.status}
                        onChange={(e) => patch({ status: e.target.value as Status })}
                      >
                        <option value="draft">{t.draft}</option>
                        <option value="sent">{t.sent}</option>
                        <option value="accepted">{t.accepted}</option>
                        <option value="declined">{t.declined}</option>
                      </select>
                    </div>
                    <Field
                      id="p-date"
                      type="date"
                      label={t.issueDate}
                      value={current.issueDate}
                      onChange={(v) => patch({ issueDate: v })}
                      error={err("issueDate")}
                    />
                    <Field
                      id="p-valid"
                      type="date"
                      label={t.validUntil}
                      value={current.validUntil}
                      onChange={(v) => patch({ validUntil: v })}
                      error={err("validUntil")}
                    />
                    <div>
                      <label htmlFor="p-lang" className="mb-1 block text-sm font-semibold">
                        {t.language}
                      </label>
                      <select
                        id="p-lang"
                        className="field"
                        value={current.lang}
                        onChange={(e) => patch({ lang: e.target.value as Lang })}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="p-currency" className="mb-1 block text-sm font-semibold">
                        {t.currency}
                      </label>
                      <select
                        id="p-currency"
                        className="field"
                        value={current.currency}
                        onChange={(e) => patch({ currency: e.target.value as Currency })}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field
                    id="p-title"
                    label={t.title}
                    value={current.title}
                    onChange={(v) => patch({ title: v })}
                    error={err("title")}
                  />
                  <Field
                    id="p-intro"
                    label={t.intro}
                    multiline
                    value={current.intro}
                    onChange={(v) => patch({ intro: v })}
                  />

                  <fieldset className="space-y-3">
                    <legend className="font-semibold">{t.client}</legend>
                    <Field
                      id="c-name"
                      label={t.clientName}
                      value={current.client.name}
                      onChange={(v) => patch({ client: { ...current.client, name: v } as Client })}
                      error={err("client.name")}
                    />
                    <Field
                      id="c-company"
                      label={t.clientCompany}
                      value={current.client.company}
                      onChange={(v) => patch({ client: { ...current.client, company: v } })}
                    />
                    <Field
                      id="c-email"
                      label={t.clientEmail}
                      type="email"
                      value={current.client.email}
                      onChange={(v) => patch({ client: { ...current.client, email: v } })}
                    />
                    <Field
                      id="c-addr"
                      label={t.clientAddress}
                      multiline
                      value={current.client.address}
                      onChange={(v) => patch({ client: { ...current.client, address: v } })}
                    />
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="font-semibold">{t.lines}</legend>
                    {err("lines") && <p className="text-sm text-stamp">{err("lines")}</p>}
                    {current.lines.map((l, idx) => (
                      <LineEditor
                        key={l.id}
                        line={l}
                        index={idx}
                        t={t}
                        problems={problems}
                        lang={current.lang}
                        onChange={(p) => updateLine(l.id, p)}
                        onRemove={() =>
                          patch({ lines: current.lines.filter((x) => x.id !== l.id) })
                        }
                      />
                    ))}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => patch({ lines: [...current.lines, newLine()] })}
                    >
                      {t.addLine}
                    </button>
                  </fieldset>

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      id="p-tax"
                      inputMode="decimal"
                      label={t.tax}
                      value={String(current.taxRate)}
                      onChange={(v) =>
                        patch({ taxRate: Math.max(0, Math.min(100, Number(v) || 0)) })
                      }
                    />
                    <Field
                      id="p-deposit"
                      inputMode="decimal"
                      label={t.deposit}
                      value={String(current.depositPercent)}
                      onChange={(v) =>
                        patch({ depositPercent: Math.max(0, Math.min(100, Number(v) || 0)) })
                      }
                    />
                  </div>

                  <Field
                    id="p-terms"
                    label={t.paymentTerms}
                    multiline
                    value={current.paymentTerms}
                    onChange={(v) => patch({ paymentTerms: v })}
                  />
                  <Field
                    id="p-notes"
                    label={t.notes}
                    multiline
                    value={current.notes}
                    onChange={(v) => patch({ notes: v })}
                  />

                  <button type="button" className="btn w-full" onClick={print}>
                    {t.export}
                  </button>
                  <p className="text-xs text-muted">{t.exportHint}</p>
                </form>

                <div className={tab === "preview" ? "" : "hidden lg:block"}>
                  <ProposalSheet proposal={current} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LineEditor(props: {
  line: Line;
  index: number;
  t: (typeof UI)["fr"] | (typeof UI)["en"];
  lang: Lang;
  problems: { field: string; message: { fr: string; en: string } }[];
  onChange: (p: Partial<Line>) => void;
  onRemove: () => void;
}) {
  const { line, index, t, lang, problems, onChange, onRemove } = props;
  const [price, setPrice] = useState(() =>
    line.unitPriceCents
      ? (line.unitPriceCents / 100).toFixed(2).replace(".", lang === "fr" ? "," : ".")
      : "",
  );
  const [qty, setQty] = useState(String(line.quantity));
  const n = index + 1;
  const e = (f: string) => problems.find((p) => p.field === `lines.${index}.${f}`)?.message[lang];
  const priceBad = price !== "" && parseAmountToCents(price) === null;
  return (
    <div className="space-y-2 rounded-md border border-line p-2">
      <Field
        id={`l${n}-d`}
        label={t.lineDesc(n)}
        value={line.description}
        onChange={(v) => onChange({ description: v })}
        error={e("description")}
      />
      <div className="grid grid-cols-3 gap-2">
        <Field
          id={`l${n}-q`}
          label={t.qty}
          inputMode="decimal"
          value={qty}
          onChange={(v) => {
            setQty(v);
            const q = parseFloat(v.replace(",", "."));
            onChange({ quantity: Number.isFinite(q) ? q : 0 });
          }}
          error={e("quantity")}
        />
        <Field
          id={`l${n}-p`}
          label={t.unitPrice}
          inputMode="decimal"
          value={price}
          onChange={(v) => {
            setPrice(v);
            onChange({ unitPriceCents: parseAmountToCents(v) ?? 0 });
          }}
          error={priceBad ? (lang === "fr" ? "Format : 1250,50" : "Format: 1250.50") : undefined}
        />
      </div>
      <button
        type="button"
        className="btn btn-danger"
        onClick={onRemove}
        aria-label={t.removeLine(n)}
      >
        {t.removeLine(n)}
      </button>
    </div>
  );
}
