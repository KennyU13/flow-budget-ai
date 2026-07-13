import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateError: null as Error | null,
  loadPromise: null as Promise<{ data: typeof storedProfile; error: null }> | null,
  profileData: null as Record<string, unknown> | null,
  updatePromise: null as Promise<{ error: Error | null }> | null,
  update: vi.fn(),
  notify: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const storedProfile = {
  first_name: "Kenny",
  last_name: "U",
  nom: "Kenny",
  birth_date: null,
  phone: null,
  country: "Madagascar",
  city: "Antananarivo",
  profession: "Développeur",
  employment_status: "self_employed",
  bio: null,
  income_range: "1500k_3000k",
  monthly_savings_goal: 200000,
  dependents: 1,
  language: "fr",
  devise: "MGA",
  ai_profile_consent: false,
  email: "db@example.com",
  avatar_url: null,
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1", email: "auth@example.com" } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(
            () =>
              mocks.loadPromise ??
              Promise.resolve({ data: mocks.profileData ?? storedProfile, error: null }),
          ),
        })),
      })),
      update: (payload: unknown) => {
        mocks.update(payload);
        return {
          eq: vi.fn(() => mocks.updatePromise ?? Promise.resolve({ error: mocks.updateError })),
        };
      },
    })),
    storage: { from: vi.fn() },
  },
}));

vi.mock("@/lib/preferences", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/preferences")>();
  return { ...actual, notifyPreferencesChanged: mocks.notify };
});

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { ProfilPage } from "./profil";

describe("ProfilPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.updateError = null;
    mocks.loadPromise = null;
    mocks.profileData = null;
    mocks.updatePromise = null;
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("charge le profil complet et sauvegarde atomiquement les préférences", async () => {
    render(<ProfilPage />);

    expect(await screen.findByLabelText("Prénom")).toHaveValue("Kenny");
    expect(screen.getByDisplayValue("auth@example.com")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Prénom"), { target: { value: "Aina" } });
    fireEvent.change(screen.getByLabelText("Langue préférée"), { target: { value: "mg" } });
    fireEvent.change(screen.getByLabelText("Devise préférée"), { target: { value: "EUR" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: "Aina", language: "mg", devise: "EUR" }),
    );
    expect(localStorage.getItem("flowbudget:language")).toBe("mg");
    expect(localStorage.getItem("flowbudget:currency")).toBe("EUR");
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });

  it("conserve le brouillon lorsque Supabase refuse la sauvegarde", async () => {
    mocks.updateError = new Error("réseau");
    render(<ProfilPage />);

    const firstName = await screen.findByLabelText("Prénom");
    fireEvent.change(firstName, { target: { value: "Brouillon" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(firstName).toHaveValue("Brouillon");
    expect(screen.getByRole("button", { name: "Enregistrer" })).not.toBeDisabled();
  });

  it("désactive tous les contrôles interactifs pendant le chargement initial", () => {
    mocks.loadPromise = new Promise(() => undefined);
    render(<ProfilPage />);

    const controls = [
      ...screen.getAllByRole("button"),
      ...screen.getAllByRole("textbox"),
      ...screen.getAllByRole("combobox"),
      ...screen.getAllByRole("spinbutton"),
      ...screen.getAllByRole("checkbox"),
    ];
    expect(controls.length).toBeGreaterThan(1);
    for (const control of controls) expect(control).toBeDisabled();
  });

  it("verrouille le formulaire pendant la sauvegarde puis conserve les valeurs", async () => {
    let resolveUpdate!: (value: { error: null }) => void;
    mocks.updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    render(<ProfilPage />);

    const firstName = await screen.findByLabelText("Prénom");
    fireEvent.change(firstName, { target: { value: "Après sauvegarde" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Enregistrement..." })).toBeDisabled(),
    );
    const form = firstName.closest("form");
    expect(form).not.toBeNull();
    for (const control of Array.from(form!.querySelectorAll("input, select, textarea, button"))) {
      expect(control).toBeDisabled();
    }

    resolveUpdate({ error: null });
    await waitFor(() => expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled());
    expect(firstName).toHaveValue("Après sauvegarde");
  });

  it("expose la complétion comme une barre de progression accessible", async () => {
    render(<ProfilPage />);

    const progress = await screen.findByRole("progressbar", { name: "Profil complété" });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(progress).toHaveAttribute("aria-valuenow", "80");
  });

  it("bloque toute modification lorsqu'un ancien profil ne peut pas être chargé sans perte", async () => {
    mocks.profileData = { ...storedProfile, devise: "CHF" };
    render(<ProfilPage />);

    expect(await screen.findByRole("alert", { name: "Profil indisponible" })).toHaveTextContent(
      "aucune donnée ne sera remplacée",
    );
    const firstName = screen.getByLabelText("Prénom");
    expect(firstName).toBeDisabled();
    fireEvent.change(firstName, { target: { value: "Écrasement" } });
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    fireEvent.submit(firstName.closest("form")!);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
