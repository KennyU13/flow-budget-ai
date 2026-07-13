import { describe, expect, it } from "vitest";

import { getFrenchErrorMessage } from "./french-errors";

describe("getFrenchErrorMessage", () => {
  it("extrait le message d'une erreur Supabase structurée", () => {
    expect(
      getFrenchErrorMessage({
        code: "PGRST116",
        message: "The result contains 0 rows",
      }),
    ).toBe("The result contains 0 rows");
  });

  it("explique qu'une colonne de profil absente nécessite la migration Supabase", () => {
    expect(
      getFrenchErrorMessage({
        code: "42703",
        message: "column profiles.first_name does not exist",
      }),
    ).toBe(
      "La base Supabase n'est pas encore à jour. Appliquez la migration du profil financier, puis actualisez la page.",
    );
  });

  it("n'affiche jamais object Object pour une erreur inconnue", () => {
    expect(getFrenchErrorMessage({ code: "UNKNOWN" }, "Erreur de chargement.")).toBe(
      "Erreur de chargement.",
    );
  });
});
