import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateError: null as Error | null,
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
          maybeSingle: vi.fn(async () => ({ data: storedProfile, error: null })),
        })),
      })),
      update: (payload: unknown) => {
        mocks.update(payload);
        return { eq: vi.fn(async () => ({ error: mocks.updateError })) };
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
});
