
-- Create companies for existing deals that don't have company_id set
INSERT INTO public.companies (user_id, company_name, created_at, updated_at)
SELECT DISTINCT 
  d.user_id,
  d.company_name,
  NOW(),
  NOW()
FROM public.deals d
LEFT JOIN public.companies c ON c.company_name = d.company_name AND c.user_id = d.user_id
WHERE d.company_id IS NULL 
  AND d.company_name IS NOT NULL 
  AND d.company_name != ''
  AND c.id IS NULL;

-- Update existing deals to link them to their corresponding companies
UPDATE public.deals 
SET company_id = c.id,
    updated_at = NOW()
FROM public.companies c
WHERE deals.company_id IS NULL 
  AND deals.company_name = c.company_name 
  AND deals.user_id = c.user_id;
