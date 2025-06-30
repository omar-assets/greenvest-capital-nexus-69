
-- Update the default stage to match pipeline expectations
ALTER TABLE public.deals 
ALTER COLUMN stage SET DEFAULT 'New';

-- Update any existing deals with old stage values to match pipeline
UPDATE public.deals 
SET stage = 'New' 
WHERE stage = 'Application Received';

UPDATE public.deals 
SET stage = 'Reviewing Documents' 
WHERE stage = 'Under Review';

UPDATE public.deals 
SET stage = 'Funded' 
WHERE stage = 'Approved';
