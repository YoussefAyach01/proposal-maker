import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProposalSheet from "@/components/ProposalSheet";
import type { Proposal } from "@/lib/proposal";

const base: Proposal = {
  id: "1",
  number: "2026-0001",
  lang: "fr",
  currency: "MAD",
  title: "Refonte du site",
  issueDate: "2026-09-01",
  validUntil: "2026-09-30",
  freelancer: {
    name: "Youssef <b>A.</b>",
    tagline: "Développeur web",
    email: "y@example.com",
    phone: "",
    address: "",
    website: "",
  },
  client: { name: "Client SARL", company: "", email: "", address: "" },
  intro: "",
  lines: [{ id: "a", description: "Design", quantity: 2, unitPriceCents: 250025 }],
  taxRate: 0,
  depositPercent: 30,
  paymentTerms: "",
  notes: "",
  status: "accepted",
};

describe("ProposalSheet smoke (French)", () => {
  const html = renderToStaticMarkup(createElement(ProposalSheet, { proposal: base }));
  it("renders number, title, total and deposit in French", () => {
    expect(html).toContain("2026-0001");
    expect(html).toContain("Refonte du site");
    expect(html).toContain("5 000,50 MAD");
    expect(html).toContain("ACCEPTÉE");
    expect(html).toContain("Acompte");
  });
  it("escapes user-supplied text", () => {
    expect(html).not.toContain("<b>A.</b>");
    expect(html).toContain("&lt;b&gt;");
  });
});

describe("ProposalSheet smoke (English)", () => {
  const html = renderToStaticMarkup(
    createElement(ProposalSheet, { proposal: { ...base, lang: "en", currency: "USD" } }),
  );
  it("renders English labels and US-style amount formatting", () => {
    expect(html).toContain("PROPOSAL");
    expect(html).toContain("ACCEPTED");
    expect(html).toContain("$5,000.50");
    expect(html).toContain("Deposit due on signature");
  });
});
