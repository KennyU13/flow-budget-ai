ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS employment_status TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS income_range TEXT,
  ADD COLUMN IF NOT EXISTS monthly_savings_goal NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS dependents SMALLINT,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS ai_profile_consent BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_bio_length_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_bio_length_check
      CHECK (bio IS NULL OR char_length(bio) <= 300);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_monthly_savings_goal_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_monthly_savings_goal_check
      CHECK (monthly_savings_goal IS NULL OR monthly_savings_goal >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_dependents_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_dependents_check
      CHECK (dependents IS NULL OR dependents BETWEEN 0 AND 20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_language_check
      CHECK (language IN ('fr', 'mg', 'en'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_employment_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_employment_status_check
      CHECK (
        employment_status IS NULL
        OR employment_status IN (
          'student', 'employed', 'self_employed', 'unemployed', 'retired', 'other'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_income_range_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_income_range_check
      CHECK (
        income_range IS NULL
        OR income_range IN (
          'under_500k', '500k_1500k', '1500k_3000k', '3000k_5000k',
          'over_5000k', 'prefer_not_to_say'
        )
      );
  END IF;
END
$$;

-- CURRENT_DATE is not immutable, so it is unsuitable for a durable CHECK
-- constraint. A trigger evaluates the rule at each write instead.
CREATE OR REPLACE FUNCTION public.validate_profile_birth_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.birth_date IS NOT NULL AND NEW.birth_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'birth_date cannot be in the future'
      USING ERRCODE = '23514',
            CONSTRAINT = 'profiles_birth_date_check';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_birth_date ON public.profiles;
CREATE TRIGGER validate_profile_birth_date
BEFORE INSERT OR UPDATE OF birth_date ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_birth_date();
