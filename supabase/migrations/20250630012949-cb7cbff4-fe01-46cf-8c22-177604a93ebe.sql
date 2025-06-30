
-- Create a trigger function to sync company name changes to deals
CREATE OR REPLACE FUNCTION sync_company_name_to_deals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If company_name was changed, update all related deals
  IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    UPDATE public.deals 
    SET company_name = NEW.company_name,
        updated_at = NOW()
    WHERE company_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync company name changes
DROP TRIGGER IF EXISTS sync_company_name_trigger ON public.companies;
CREATE TRIGGER sync_company_name_trigger
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_name_to_deals();
