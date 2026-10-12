// Pure proposal logic. All money is integer centimes/cents to avoid float drift.

export const CURRENCIES = ["MAD", "EUR", "USD", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const LANGS = ["fr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export type Status = "draft" | "sent" | "accepted" | "declined";

export interface Line {
  id: string;
  description: string;
  quantity: number; // may be decimal (e.g. 1.5 days)
  unitPriceCents: number;
}

export interface Freelancer {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  website: string;
}

export interface Client {
  name: string;
  company: string;
  email: string;
  address: string;
}

export interface Proposal {
  id: string;
  number: string;
  lang: Lang;
  currency: Currency;
  title: string;
  issueDate: string; // YYYY-MM-DD
  validUntil: string;
  freelancer: Freelancer;
  client: Client;
  intro: string;
  lines: Line[];
  taxRate: number; // 0-100, 0 if the freelancer doesn't charge tax
  depositPercent: number; // 0-100, 0 if no deposit requested
  paymentTerms: string;
  notes: string;
  status: Status;
}

export interface Totals {
  subtotal: number;
  tax: number;
  total: number;
  deposit: number;
}

/** Round half away from zero to an integer. */
export function roundHalf(n: number): number {
  return Math.sign(n) * Math.round(Math.abs(n) + 1e-9);
}

export function lineTotal(line: Pick<Line, "quantity" | "unitPriceCents">): number {
  return roundHalf(line.quantity * line.unitPriceCents);
}

export function computeTotals(lines: Line[], taxRate: number, depositPercent: number): Totals {
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const tax = roundHalf((subtotal * taxRate) / 100);
  const total = subtotal + tax;
  const deposit = roundHalf((total * depositPercent) / 100);
  return { subtotal, tax, total, deposit };
}

/** Parse a user-typed amount ("1 250,50", "1250.5") into cents. Returns null if invalid. */
export function parseAmountToCents(input: string): number | null {
  const s = input.replace(/[\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return roundHalf(parseFloat(s) * 100);
}

const SYMBOLS: Record<Currency, string> = { MAD: "MAD", EUR: "€", USD: "$", GBP: "£" };

/** 450000 -> "4 500,00 MAD" (fr) / "4,500.00 MAD" (en). EUR/USD/GBP use their usual symbol. */
export function formatAmount(cents: number, currency: Currency, lang: Lang): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = (abs % 100).toString().padStart(2, "0");
  const groupSep = lang === "fr" ? " " : ",";
  const decSep = lang === "fr" ? "," : ".";
  const groupedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
  const amount = `${sign}${groupedWhole}${decSep}${frac}`;
  const symbol = SYMBOLS[currency];
  return currency === "MAD" ? `${amount} ${symbol}` : `${symbol}${amount}`;
}

/** Sequential number per year: 2026-0001. Continues from the highest number used that year. */
export function nextProposalNumber(existing: string[], year: number): string {
  const re = new RegExp(`^${year}-(\\d{4,})$`);
  let max = 0;
  for (const n of existing) {
    const m = re.exec(n);
    if (m) max = Math.max(max, parseInt(m[1] as string, 10));
  }
  return `${year}-${String(max + 1).padStart(4, "0")}`;
}

export interface Problem {
  field: string;
  message: { fr: string; en: string };
}

/** Checks the fields a usable proposal needs before it's exported. */
export function validateProposal(p: Proposal): Problem[] {
  const problems: Problem[] = [];
  if (!p.freelancer.name.trim()) {
    problems.push({
      field: "freelancer.name",
      message: { fr: "Votre nom est requis", en: "Your name is required" },
    });
  }
  if (!p.client.name.trim()) {
    problems.push({
      field: "client.name",
      message: { fr: "Nom du client requis", en: "Client name is required" },
    });
  }
  if (!p.title.trim()) {
    problems.push({
      field: "title",
      message: { fr: "Titre du projet requis", en: "Project title is required" },
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.issueDate)) {
    problems.push({
      field: "issueDate",
      message: { fr: "Date d'émission invalide", en: "Invalid issue date" },
    });
  }
  if (p.validUntil && p.validUntil < p.issueDate) {
    problems.push({
      field: "validUntil",
      message: {
        fr: "La validité précède la date d'émission",
        en: "Valid-until date is before the issue date",
      },
    });
  }
  if (p.lines.length === 0) {
    problems.push({
      field: "lines",
      message: { fr: "Ajoutez au moins une ligne", en: "Add at least one line" },
    });
  }
  p.lines.forEach((l, i) => {
    if (!l.description.trim()) {
      problems.push({
        field: `lines.${i}.description`,
        message: {
          fr: `Ligne ${i + 1} : description requise`,
          en: `Line ${i + 1}: description required`,
        },
      });
    }
    if (!(l.quantity > 0)) {
      problems.push({
        field: `lines.${i}.quantity`,
        message: { fr: `Ligne ${i + 1} : quantité > 0`, en: `Line ${i + 1}: quantity must be > 0` },
      });
    }
    if (!(l.unitPriceCents >= 0)) {
      problems.push({
        field: `lines.${i}.price`,
        message: { fr: `Ligne ${i + 1} : prix invalide`, en: `Line ${i + 1}: invalid price` },
      });
    }
  });
  return problems;
}
