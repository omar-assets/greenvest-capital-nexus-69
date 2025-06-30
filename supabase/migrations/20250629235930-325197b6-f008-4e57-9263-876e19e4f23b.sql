
-- Create deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_number TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  amount_requested NUMERIC NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Application Received',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policies for deals
CREATE POLICY "Users can view their own deals" 
  ON public.deals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deals" 
  ON public.deals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals" 
  ON public.deals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals" 
  ON public.deals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to generate deal numbers
CREATE OR REPLACE FUNCTION public.generate_deal_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  deal_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the next number for this year
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(deal_number, '-', 3) AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM public.deals
  WHERE deal_number LIKE 'MCA-' || current_year || '-%';
  
  -- Format the deal number with leading zeros
  deal_number := 'MCA-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN deal_number;
END;
$$;

-- Create trigger to auto-generate deal numbers
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

CREATE TRIGGER set_deal_number_trigger
  BEFORE INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deal_number();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
