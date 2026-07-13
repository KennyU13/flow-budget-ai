import { afterEach, describe, expect, it, vi } from "vitest";

import { getAiProfileContext, getProfileCompletion, profileSchema, type Profile } from "./profile";

const emptyProfile: Profile = {
  first_name: null,
  last_name: null,
  nom: null,
  birth_date: null,
  phone: null,
  country: null,
  city: null,
  profession: null,
  employment_status: null,
  bio: null,
  income_range: null,
  monthly_savings_goal: null,
  dependents: null,
  language: null,
  devise: null,
  ai_profile_consent: false,
};

afterEach(() => {
  vi.useRealTimers();
});

describe("profileSchema", () => {
  it("normalizes optional text values", () => {
    const result = profileSchema.parse({
      ...emptyProfile,
      first_name: "  Aina  ",
      bio: "   ",
    });

    expect(result.first_name).toBe("Aina");
    expect(result.bio).toBeNull();
  });

  it("accepts valid boundary values", () => {
    const result = profileSchema.safeParse({
      ...emptyProfile,
      first_name: "a".repeat(100),
      phone: "+261 34 12 345 67",
      bio: "b".repeat(300),
      dependents: 20,
      monthly_savings_goal: 0,
      birth_date: new Date().toISOString().slice(0, 10),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a future birth date", () => {
    expect(profileSchema.safeParse({ ...emptyProfile, birth_date: "2999-01-01" }).success).toBe(
      false,
    );
  });

  it("uses Antananarivo's calendar date around the UTC day boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-12T21:30:00.000Z"));

    expect(profileSchema.safeParse({ ...emptyProfile, birth_date: "2026-07-13" }).success).toBe(
      true,
    );
    expect(profileSchema.safeParse({ ...emptyProfile, birth_date: "2026-07-14" }).success).toBe(
      false,
    );
  });

  it("rejects a nonexistent calendar birth date", () => {
    expect(profileSchema.safeParse({ ...emptyProfile, birth_date: "2025-02-31" }).success).toBe(
      false,
    );
  });

  it("rejects 21 dependents", () => {
    expect(profileSchema.safeParse({ ...emptyProfile, dependents: 21 }).success).toBe(false);
  });

  it.each([
    ["first_name", "a".repeat(101)],
    ["last_name", "a".repeat(101)],
    ["nom", "a".repeat(101)],
    ["country", "a".repeat(101)],
    ["city", "a".repeat(101)],
    ["profession", "a".repeat(101)],
    ["phone", "123 extension"],
    ["phone", "+() -"],
    ["phone", "261-34"],
    ["phone", "261.34"],
    ["phone", "261 (34)"],
    ["phone", "261+34"],
    ["phone", "++261"],
    ["phone", "1".repeat(31)],
    ["bio", "b".repeat(301)],
    ["dependents", -1],
    ["dependents", 1.5],
    ["monthly_savings_goal", -0.01],
  ])("rejects an invalid boundary for %s", (field, value) => {
    expect(profileSchema.safeParse({ ...emptyProfile, [field]: value }).success).toBe(false);
  });

  it.each([
    ["employment_status", "contractor"],
    ["income_range", "500k"],
    ["language", "de"],
    ["devise", "GBP"],
  ])("rejects an unknown %s enum value", (field, value) => {
    expect(profileSchema.safeParse({ ...emptyProfile, [field]: value }).success).toBe(false);
  });
});

describe("getProfileCompletion", () => {
  it("returns 0 for an empty profile and 100 for a full profile", () => {
    expect(getProfileCompletion(emptyProfile)).toBe(0);
    expect(
      getProfileCompletion({
        first_name: "Aina",
        last_name: "Rakoto",
        nom: "aina-r",
        birth_date: "1990-01-01",
        phone: "+261 34 00 000 00",
        country: "Madagascar",
        city: "Antananarivo",
        profession: "Designer",
        employment_status: "self_employed",
        bio: "Indépendante",
        income_range: "1500k_3000k",
        monthly_savings_goal: 200000,
        dependents: 2,
        language: "mg",
        devise: "MGA",
        ai_profile_consent: true,
      }),
    ).toBe(100);
  });

  it("returns a stable percentage between 0 and 100 for a partial profile", () => {
    const completion = getProfileCompletion({
      ...emptyProfile,
      first_name: "Aina",
    });

    expect(completion).toBe(7);
    expect(completion).toBeGreaterThan(0);
    expect(completion).toBeLessThanOrEqual(100);
  });
});

describe("getAiProfileContext", () => {
  const financialProfile: Profile = {
    ...emptyProfile,
    first_name: "Secret",
    last_name: "Person",
    phone: "+261 00 000 00",
    income_range: "500k_1500k",
    monthly_savings_goal: 150000,
    employment_status: "employed",
    dependents: 1,
  };

  it("returns null without consent", () => {
    expect(getAiProfileContext(financialProfile)).toBeNull();
  });

  it("returns exactly the allowed financial fields with consent and no PII", () => {
    const context = getAiProfileContext({
      ...financialProfile,
      ai_profile_consent: true,
    });

    expect(context).toEqual({
      incomeRange: "500k_1500k",
      savingsGoal: 150000,
      employmentStatus: "employed",
      dependents: 1,
    });
    expect(Object.keys(context ?? {}).sort()).toEqual(
      ["dependents", "employmentStatus", "incomeRange", "savingsGoal"].sort(),
    );
    expect(JSON.stringify(context)).not.toContain("Secret");
  });

  it("accepts null financial values in the consented context", () => {
    expect(getAiProfileContext({ ...emptyProfile, ai_profile_consent: true })).toEqual({
      incomeRange: null,
      savingsGoal: null,
      employmentStatus: null,
      dependents: null,
    });
  });
});
