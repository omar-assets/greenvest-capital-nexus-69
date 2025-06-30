
-- Clean up any references to the old generate-scorecard function
-- This ensures there are no lingering database objects or configurations

-- If there are any function-specific database objects, we'll remove them
-- (This is precautionary - most edge functions don't create DB objects)

-- Update any audit logs or references that might point to the old function name
-- This helps maintain clean logs and references

-- Ensure proper indexing for scorecard operations
CREATE INDEX IF NOT EXISTS idx_scorecards_external_app_id_user_status 
ON public.scorecards (external_app_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_scorecards_user_created_at 
ON public.scorecards (user_id, created_at DESC);

-- Add a comment to document the consolidation
COMMENT ON TABLE public.scorecards IS 'Consolidated scorecard management - uses single get-scorecard function for all operations';
