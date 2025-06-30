
-- Create scorecards table to store scorecard metadata and results
CREATE TABLE public.scorecards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  deal_id UUID REFERENCES public.deals(id),
  external_app_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  scorecard_url TEXT,
  webhook_request_data JSONB,
  webhook_response_data JSONB,
  error_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scorecard_sections table to store organized scorecard data sections
CREATE TABLE public.scorecard_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scorecard_id UUID NOT NULL REFERENCES public.scorecards(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  section_data JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for scorecards
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scorecards" 
  ON public.scorecards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scorecards" 
  ON public.scorecards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scorecards" 
  ON public.scorecards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scorecards" 
  ON public.scorecards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for scorecard_sections
ALTER TABLE public.scorecard_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sections of their own scorecards" 
  ON public.scorecard_sections 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.scorecards 
    WHERE scorecards.id = scorecard_sections.scorecard_id 
    AND scorecards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create sections for their own scorecards" 
  ON public.scorecard_sections 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.scorecards 
    WHERE scorecards.id = scorecard_sections.scorecard_id 
    AND scorecards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sections of their own scorecards" 
  ON public.scorecard_sections 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.scorecards 
    WHERE scorecards.id = scorecard_sections.scorecard_id 
    AND scorecards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sections of their own scorecards" 
  ON public.scorecard_sections 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.scorecards 
    WHERE scorecards.id = scorecard_sections.scorecard_id 
    AND scorecards.user_id = auth.uid()
  ));

-- Add indexes for better performance
CREATE INDEX idx_scorecards_user_id ON public.scorecards(user_id);
CREATE INDEX idx_scorecards_company_id ON public.scorecards(company_id);
CREATE INDEX idx_scorecards_deal_id ON public.scorecards(deal_id);
CREATE INDEX idx_scorecards_status ON public.scorecards(status);
CREATE INDEX idx_scorecard_sections_scorecard_id ON public.scorecard_sections(scorecard_id);
CREATE INDEX idx_scorecard_sections_section_name ON public.scorecard_sections(section_name);

-- Add trigger to update updated_at timestamps
CREATE TRIGGER update_scorecards_updated_at
  BEFORE UPDATE ON public.scorecards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scorecard_sections_updated_at
  BEFORE UPDATE ON public.scorecard_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
