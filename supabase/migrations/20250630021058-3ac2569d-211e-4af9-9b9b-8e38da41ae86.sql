
-- Add underwriting fields to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS underwriting_status TEXT DEFAULT 'pending';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS underwriting_notes TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS underwriter_id UUID;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS underwriting_date TIMESTAMP WITH TIME ZONE;

-- Add constraint for underwriting status (without IF NOT EXISTS as it's not supported)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_underwriting_status_check') THEN
    ALTER TABLE public.deals ADD CONSTRAINT deals_underwriting_status_check 
      CHECK (underwriting_status IN ('pending', 'approved', 'declined', 'more_info_needed'));
  END IF;
END $$;

-- Create underwriting checklist table
CREATE TABLE IF NOT EXISTS public.deal_underwriting_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  documents_complete BOOLEAN DEFAULT FALSE,
  bank_statements_reviewed BOOLEAN DEFAULT FALSE,
  credit_checked BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL,
  user_id UUID NOT NULL
);

-- Enable RLS on the checklist table
ALTER TABLE public.deal_underwriting_checklist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for checklist table
CREATE POLICY "Users can view their own deal checklists" 
  ON public.deal_underwriting_checklist 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deal checklists" 
  ON public.deal_underwriting_checklist 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deal checklists" 
  ON public.deal_underwriting_checklist 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger to update checklist updated_at
CREATE OR REPLACE FUNCTION public.update_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_updated_at
  BEFORE UPDATE ON public.deal_underwriting_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_checklist_updated_at();
