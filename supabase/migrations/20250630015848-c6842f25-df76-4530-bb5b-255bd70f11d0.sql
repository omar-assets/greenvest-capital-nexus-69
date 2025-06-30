
-- Create enhanced activities table
CREATE TABLE public.deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('auto', 'manual')),
  category TEXT NOT NULL CHECK (category IN ('deal_created', 'stage_changed', 'document_uploaded', 'field_updated', 'note', 'call', 'email')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  mentioned_users UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities for deals they own
CREATE POLICY "Users can view activities for their deals" 
  ON public.deal_activities 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_activities.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

-- Users can create activities for their deals
CREATE POLICY "Users can create activities for their deals" 
  ON public.deal_activities 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_activities.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_deal_activities_deal_id ON public.deal_activities(deal_id);
CREATE INDEX idx_deal_activities_created_at ON public.deal_activities(created_at DESC);
CREATE INDEX idx_deal_activities_category ON public.deal_activities(category);

-- Enhanced function to log deal changes as activities
CREATE OR REPLACE FUNCTION public.log_deal_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_title TEXT;
  activity_description TEXT;
  activity_metadata JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Deal created activity
    activity_title := 'Deal ' || NEW.deal_number || ' created';
    activity_description := 'New deal created for ' || NEW.company_name;
    activity_metadata := jsonb_build_object(
      'amount_requested', NEW.amount_requested,
      'stage', NEW.stage
    );
    
    INSERT INTO public.deal_activities (
      deal_id, user_id, activity_type, category, title, description, metadata
    ) VALUES (
      NEW.id, NEW.user_id, 'auto', 'deal_created', activity_title, activity_description, activity_metadata
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Stage changed activity
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      activity_title := 'Stage changed to ' || NEW.stage;
      activity_description := 'Deal stage changed from ' || OLD.stage || ' to ' || NEW.stage;
      activity_metadata := jsonb_build_object(
        'old_stage', OLD.stage,
        'new_stage', NEW.stage
      );
      
      INSERT INTO public.deal_activities (
        deal_id, user_id, activity_type, category, title, description, metadata
      ) VALUES (
        NEW.id, NEW.user_id, 'auto', 'stage_changed', activity_title, activity_description, activity_metadata
      );
    END IF;
    
    -- Financial data updated
    IF OLD.monthly_revenue IS DISTINCT FROM NEW.monthly_revenue 
       OR OLD.average_daily_balance IS DISTINCT FROM NEW.average_daily_balance
       OR OLD.credit_score IS DISTINCT FROM NEW.credit_score
       OR OLD.factor_rate IS DISTINCT FROM NEW.factor_rate
       OR OLD.term_months IS DISTINCT FROM NEW.term_months THEN
      
      activity_title := 'Financial data updated';
      activity_description := 'Deal financial information has been updated';
      activity_metadata := jsonb_build_object(
        'old_values', jsonb_build_object(
          'monthly_revenue', OLD.monthly_revenue,
          'average_daily_balance', OLD.average_daily_balance,
          'credit_score', OLD.credit_score,
          'factor_rate', OLD.factor_rate,
          'term_months', OLD.term_months
        ),
        'new_values', jsonb_build_object(
          'monthly_revenue', NEW.monthly_revenue,
          'average_daily_balance', NEW.average_daily_balance,
          'credit_score', NEW.credit_score,
          'factor_rate', NEW.factor_rate,
          'term_months', NEW.term_months
        )
      );
      
      INSERT INTO public.deal_activities (
        deal_id, user_id, activity_type, category, title, description, metadata
      ) VALUES (
        NEW.id, NEW.user_id, 'auto', 'field_updated', activity_title, activity_description, activity_metadata
      );
    END IF;
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for deal activities
DROP TRIGGER IF EXISTS deal_activity_trigger ON public.deals;
CREATE TRIGGER deal_activity_trigger
  AFTER INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.log_deal_activity();

-- Function to log document upload activities
CREATE OR REPLACE FUNCTION public.log_document_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_title TEXT;
  activity_description TEXT;
  activity_metadata JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    activity_title := 'Document uploaded: ' || NEW.original_filename;
    activity_description := 'Document "' || NEW.original_filename || '" uploaded in ' || NEW.document_category || ' category';
    activity_metadata := jsonb_build_object(
      'filename', NEW.original_filename,
      'file_type', NEW.file_type,
      'file_size', NEW.file_size,
      'document_category', NEW.document_category
    );
    
    INSERT INTO public.deal_activities (
      deal_id, user_id, activity_type, category, title, description, metadata
    ) VALUES (
      NEW.deal_id, NEW.user_id, 'auto', 'document_uploaded', activity_title, activity_description, activity_metadata
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for document activities
DROP TRIGGER IF EXISTS document_activity_trigger ON public.deal_documents;
CREATE TRIGGER document_activity_trigger
  AFTER INSERT ON public.deal_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_activity();
