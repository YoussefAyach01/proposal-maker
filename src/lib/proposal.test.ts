import { describe, expect, it } from "vitest";
import {
  computeTotals,
  formatAmount,
  lineTotal,
  nextProposalNumber,
  parseAmountToCents,
  validateProposal,
  type Proposal,
} from "./proposal";

describe("amounts", () => {
  it.each([
    ["45", 4500],
    ["12,5", 1250],
    ["12.50", 1250],
    ["0", 0],
    [" 1 250,50 ", 125050],
  ])("parses %s", (input, cents) => expect(parseAmountToCents(input)).toBe(cents));

  it.each(["", "abc", "-5", "1.234", "12,,5"])("rejects %j", (input) =>
    expect(parseAmountToCents(input)).toBeNull(),
  );

  it("formats French and English grouping/decimals", () => {
    expect(formatAmount(450000, "MAD", "fr")).toBe("4 500,00 MAD");
    expect(formatAmount(450000, "MAD", "en")).toBe("4,500.00 MAD");
    expect(formatAmount(125050, "EUR", "fr")).toBe("€1 250,50");
    expect(formatAmount(125050, "USD", "en")).toBe("$1,250.50");
    expect(formatAmount(-500, "MAD", "fr")).toBe("-5,00 MAD");
  });
});

describe("line and totals", () => {
  const lines = [
    { id: "a", description: "Design", quantity: 2, unitPriceCents: 150000 },
    { id: "b", description: "Hosting", quantity: 1, unitPriceCents: 60000 },
  ];

  it("multiplies quantity by unit price, rounding half away from zero", () => {
    expect(lineTotal({ quantity: 1.5, unitPriceCents: 1001 })).toBe(1502); // 1501.5 -> 1502
  });

  it("computes subtotal, tax and deposit", () => {
    const totals = computeTotals(lines, 20, 30);
    expect(totals.subtotal).toBe(360000);
    expect(totals.tax).toBe(72000);
    expect(totals.total).toBe(432000);
    expect(totals.deposit).toBe(129600);
  });

  it("skips tax and deposit when both are zero", () => {
    const totals = computeTotals(lines, 0, 0);
    expect(totals.tax).toBe(0);
    expect(totals.deposit).toBe(0);
    expect(totals.total).toBe(totals.subtotal);
  });
});

describe("numbering", () => {
  it("starts at 0001 and continues from the highest number used that year", () => {
    expect(nextProposalNumber([], 2026)).toBe("2026-0001");
    expect(nextProposalNumber(["2026-0001", "2026-0003", "2025-0099"], 2026)).toBe("2026-0004");
  });
});

function makeProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: "1",
    number: "2026-0001",
    lang: "fr",
    currency: "MAD",
    title: "Site web",
    issueDate: "2026-09-01",
    validUntil: "2026-09-30",
    freelancer: { name: "Youssef", tagline: "", email: "", phone: "", address: "", website: "" },
    client: { name: "Client", company: "", email: "", address: "" },
    intro: "",
    lines: [{ id: "a", description: "Design", quantity: 1, unitPriceCents: 1000 }],
    taxRate: 0,
    depositPercent: 0,
    paymentTerms: "",
    notes: "",
    status: "draft",
    ...overrides,
  };
}

describe("validation", () => {
  it("accepts a complete proposal", () => {
    expect(validateProposal(makeProposal())).toHaveLength(0);
  });

  it("flags a missing freelancer name, client name and title", () => {
    const problems = validateProposal(
      makeProposal({
        freelancer: { name: "", tagline: "", email: "", phone: "", address: "", website: "" },
        client: { name: "", company: "", email: "", address: "" },
        title: "",
      }),
    );
    expect(problems.map((p) => p.field)).toEqual(
      expect.arrayContaining(["freelancer.name", "client.name", "title"]),
    );
  });

  it("flags validUntil before issueDate", () => {
    const problems = validateProposal(makeProposal({ validUntil: "2026-08-01" }));
    expect(problems.map((p) => p.field)).toContain("validUntil");
  });

  it("flags an empty line list and bad line fields", () => {
    expect(validateProposal(makeProposal({ lines: [] })).map((p) => p.field)).toContain("lines");
    const problems = validateProposal(
      makeProposal({ lines: [{ id: "a", description: "", quantity: 0, unitPriceCents: -1 }] }),
    );
    expect(problems.map((p) => p.field)).toEqual(
      expect.arrayContaining(["lines.0.description", "lines.0.quantity", "lines.0.price"]),
    );
  });

  it("gives a bilingual message for every problem", () => {
    const problems = validateProposal(makeProposal({ title: "" }));
    const titleProblem = problems.find((p) => p.field === "title");
    expect(titleProblem?.message.fr).toBeTruthy();
    expect(titleProblem?.message.en).toBeTruthy();
    expect(titleProblem?.message.fr).not.toBe(titleProblem?.message.en);
  });
});
