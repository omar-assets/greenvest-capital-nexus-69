
-- Create ISOs table to store ISO information
CREATE TABLE public.isos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iso_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  commission_rate DECIMAL(5,4) DEFAULT 0.05, -- Default 5% commission
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add ISO tracking fields to deals table
ALTER TABLE public.deals 
ADD COLUMN iso_id UUID REFERENCES public.isos(id),
ADD COLUMN iso_name TEXT; -- Denormalized for performance

-- Add ISO commission tracking to offers table
ALTER TABLE public.offers
ADD COLUMN iso_commission_rate DECIMAL(5,4);

-- Enable RLS on ISOs table
ALTER TABLE public.isos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ISOs table
CREATE POLICY "Users can view their own ISOs" 
  ON public.isos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ISOs" 
  ON public.isos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ISOs" 
  ON public.isos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ISOs" 
  ON public.isos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add updated_at trigger for ISOs table
CREATE TRIGGER update_isos_updated_at 
  BEFORE UPDATE ON public.isos 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to sync ISO name to deals when ISO is updated
CREATE OR REPLACE FUNCTION public.sync_iso_name_to_deals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If iso_name was changed, update all related deals
  IF OLD.iso_name IS DISTINCT FROM NEW.iso_name THEN
    UPDATE public.deals 
    SET iso_name = NEW.iso_name,
        updated_at = NOW()
    WHERE iso_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to sync ISO name changes to deals
CREATE TRIGGER sync_iso_name_to_deals_trigger
  AFTER UPDATE ON public.isos
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_iso_name_to_deals();
