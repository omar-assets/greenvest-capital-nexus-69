
-- Fix the generate_deal_number function to resolve column ambiguity
CREATE OR REPLACE FUNCTION public.generate_deal_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  new_deal_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the next number for this year with table alias to avoid ambiguity
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(d.deal_number, '-', 3) AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM public.deals d
  WHERE d.deal_number LIKE 'MCA-' || current_year || '-%';
  
  -- Format the deal number with leading zeros
  new_deal_number := 'MCA-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_deal_number;
END;
$$;
