
-- Add webhook tracking fields to companies table
ALTER TABLE public.companies 
ADD COLUMN external_app_id INTEGER,
ADD COLUMN external_app_number TEXT,
ADD COLUMN webhook_metadata JSONB,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create unique index on external_app_id to prevent duplicates
CREATE UNIQUE INDEX idx_companies_external_app_id 
ON public.companies(external_app_id, user_id) 
WHERE external_app_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX idx_companies_external_app_number 
ON public.companies(external_app_number, user_id) 
WHERE external_app_number IS NOT NULL;
