
-- Add financial data columns to the deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS average_daily_balance NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS credit_score INTEGER;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS factor_rate NUMERIC DEFAULT 1.25;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS term_months INTEGER DEFAULT 12;

-- Add constraints for data validation
ALTER TABLE public.deals ADD CONSTRAINT credit_score_range CHECK (credit_score IS NULL OR (credit_score >= 300 AND credit_score <= 850));
ALTER TABLE public.deals ADD CONSTRAINT factor_rate_minimum CHECK (factor_rate IS NULL OR factor_rate >= 1.0);
ALTER TABLE public.deals ADD CONSTRAINT term_months_positive CHECK (term_months IS NULL OR term_months > 0);
