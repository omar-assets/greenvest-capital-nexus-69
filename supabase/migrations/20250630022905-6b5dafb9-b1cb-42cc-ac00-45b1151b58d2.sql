
-- Update the check constraint on deal_activities to include offer-related categories
ALTER TABLE public.deal_activities 
DROP CONSTRAINT deal_activities_category_check;

ALTER TABLE public.deal_activities 
ADD CONSTRAINT deal_activities_category_check 
CHECK (category IN ('deal_created', 'stage_changed', 'document_uploaded', 'field_updated', 'note', 'call', 'email', 'offer_created', 'offer_status_changed'));
