import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileField } from "./profile-field";
import { ProfileSection } from "./profile-section";

describe("ProfileField", () => {
  it("relie le contrôle à sa description et à son erreur", () => {
    render(
      <ProfileField label="Téléphone" description="Format international" error="Numéro invalide">
        <input id="phone" />
      </ProfileField>,
    );

    const input = screen.getByLabelText("Téléphone");
    expect(input).toHaveAttribute("aria-describedby", "phone-description phone-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Numéro invalide")).toHaveAttribute("role", "alert");
  });
});

describe("ProfileSection", () => {
  it("rend une section nommée et une grille responsive", () => {
    const { container } = render(
      <ProfileSection title="Identité" description="Vos informations personnelles">
        <input aria-label="Prénom" />
      </ProfileSection>,
    );

    expect(screen.getByRole("heading", { name: "Identité" })).toBeInTheDocument();
    expect(container.querySelector(".sm\\:grid-cols-2")).toBeInTheDocument();
  });
});
