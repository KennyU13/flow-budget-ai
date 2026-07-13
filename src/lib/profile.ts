import { z } from "zod";

export const employmentStatusSchema = z.enum([
  "student",
  "employed",
  "self_employed",
  "unemployed",
  "retired",
  "other",
]);

export const incomeRangeSchema = z.enum([
  "under_500k",
  "500k_1500k",
  "1500k_3000k",
  "3000k_5000k",
  "over_5000k",
  "prefer_not_to_say",
]);

export const languageSchema = z.enum(["fr", "mg", "en"]);
export const currencySchema = z.enum(["MGA", "EUR", "USD"]);

const optionalText = (maximum: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim();
    return normalized === "" ? null : normalized;
  }, z.string().max(maximum).nullable().default(null));

function getAntananarivoCalendarDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Indian/Antananarivo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

const birthDateSchema = optionalText(10).refine(
  (value) => {
    if (value === null) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.valueOf()) &&
      date.toISOString().slice(0, 10) === value &&
      value <= getAntananarivoCalendarDate(new Date())
    );
  },
  { message: "La date de naissance ne peut pas être future" },
);

const phoneSchema = optionalText(30).refine(
  (value) => value === null || /^\+?[0-9 ]*[0-9][0-9 ]*$/.test(value),
  { message: "Le numéro de téléphone contient des caractères invalides" },
);

export const profileSchema = z.object({
  first_name: optionalText(100),
  last_name: optionalText(100),
  nom: optionalText(100),
  birth_date: birthDateSchema,
  phone: phoneSchema,
  country: optionalText(100),
  city: optionalText(100),
  profession: optionalText(100),
  employment_status: employmentStatusSchema.nullable().default(null),
  bio: optionalText(300),
  income_range: incomeRangeSchema.nullable().default(null),
  monthly_savings_goal: z.number().min(0).nullable().default(null),
  dependents: z.number().int().min(0).max(20).nullable().default(null),
  language: languageSchema.nullable().default(null),
  devise: currencySchema.nullable().default(null),
  ai_profile_consent: z.boolean().default(false),
});

export type Profile = z.infer<typeof profileSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;
export type IncomeRange = z.infer<typeof incomeRangeSchema>;
export type ProfileLanguage = z.infer<typeof languageSchema>;
export type ProfileCurrency = z.infer<typeof currencySchema>;

/**
 * Completion counts these 15 optional fields equally: first name, last name,
 * display name, birth date, phone, country, city, profession, employment
 * status, bio, income range, savings goal, dependents, language and currency.
 * AI consent is deliberately excluded because declining consent is not missing
 * profile information.
 */
const completionFields = [
  "first_name",
  "last_name",
  "nom",
  "birth_date",
  "phone",
  "country",
  "city",
  "profession",
  "employment_status",
  "bio",
  "income_range",
  "monthly_savings_goal",
  "dependents",
  "language",
  "devise",
] as const satisfies readonly (keyof Profile)[];

export function getProfileCompletion(profile: Profile): number {
  const completed = completionFields.filter((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== "";
  }).length;

  return Math.round((completed / completionFields.length) * 100);
}

export type AiProfileContext = {
  incomeRange: IncomeRange | null;
  savingsGoal: number | null;
  employmentStatus: EmploymentStatus | null;
  dependents: number | null;
};

export function getAiProfileContext(profile: Profile): AiProfileContext | null {
  if (!profile.ai_profile_consent) return null;

  return {
    incomeRange: profile.income_range,
    savingsGoal: profile.monthly_savings_goal,
    employmentStatus: profile.employment_status,
    dependents: profile.dependents,
  };
}
