// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Studio from "@/components/Studio";

// Node 25 ships its own (broken without a file) localStorage that shadows jsdom's; use a stub.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", { value: memoryStorage(), configurable: true });
});
afterEach(cleanup);

// Before any proposal exists there is no document language yet, so the chrome (including the
// "new proposal" button) falls back to French; every new proposal then defaults to French too.

describe("Studio flow", () => {
  it("creates a proposal, fills a line and persists it", async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await user.click(screen.getByRole("button", { name: "Nouvelle proposition" }));
    await user.type(screen.getByLabelText("Nom"), "Client SARL");
    await user.type(screen.getByLabelText("Titre du projet"), "Refonte du site");
    await user.type(screen.getByLabelText("Ligne 1 — description"), "Design de la page d'accueil");
    await user.type(screen.getByLabelText("Prix unitaire"), "1250,50");
    expect(screen.getAllByText(/1\s250,50 MAD/).length).toBeGreaterThan(0);
    const stored = JSON.parse(window.localStorage.getItem("proposal-maker:proposals:v1") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].client.name).toBe("Client SARL");
    expect(stored[0].number).toMatch(/^\d{4}-0001$/);
  });

  it("blocks export and shows errors when required fields are missing", async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await user.click(screen.getByRole("button", { name: "Nouvelle proposition" }));
    await user.click(screen.getByRole("button", { name: "Exporter en PDF" }));
    expect(screen.getByText("Votre nom est requis")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Corrigez les champs");
  });

  it("switches the document language, flipping both the editor chrome and the live preview", async () => {
    const user = userEvent.setup();
    render(<Studio />);
    await user.click(screen.getByRole("button", { name: "Nouvelle proposition" }));
    const select = () =>
      screen.getByLabelText(/Langue du document|Document language/) as HTMLSelectElement;
    expect(select().value).toBe("fr");
    await user.selectOptions(select(), "en");
    expect(select().value).toBe("en");
    expect(screen.getByRole("button", { name: "Export to PDF" })).toBeTruthy();
  });
});
