
-- Update the deals table to make deal_number have an empty string default
-- This will allow the trigger to work properly while satisfying TypeScript
ALTER TABLE public.deals ALTER COLUMN deal_number SET DEFAULT '';

-- Update the trigger function to handle empty strings as well
CREATE OR REPLACE FUNCTION public.set_deal_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.deal_number IS NULL OR NEW.deal_number = '' THEN
    NEW.deal_number := public.generate_deal_number();
  END IF;
  RETURN NEW;
END;
$$;
