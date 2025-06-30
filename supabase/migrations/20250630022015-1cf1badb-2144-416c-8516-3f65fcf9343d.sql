
-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_number TEXT NOT NULL UNIQUE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC NOT NULL,
  factor_rate NUMERIC NOT NULL DEFAULT 1.25,
  buy_rate NUMERIC,
  term_months INTEGER NOT NULL DEFAULT 12,
  payment_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (payment_frequency IN ('daily', 'weekly')),
  total_payback NUMERIC GENERATED ALWAYS AS (amount * factor_rate) STORED,
  daily_payment NUMERIC,
  weekly_payment NUMERIC,
  iso_commission NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined')),
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own offers" 
  ON public.offers 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own offers" 
  ON public.offers 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers" 
  ON public.offers 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers" 
  ON public.offers 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to generate offer numbers
CREATE OR REPLACE FUNCTION public.generate_offer_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  offer_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the next number for this year
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(o.offer_number, '-', 3) AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM public.offers o
  WHERE o.offer_number LIKE 'OFF-' || current_year || '-%';
  
  -- Format the offer number with leading zeros
  offer_number := 'OFF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN offer_number;
END;
$$;

-- Create trigger to auto-generate offer numbers
CREATE OR REPLACE FUNCTION public.set_offer_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.offer_number IS NULL OR NEW.offer_number = '' THEN
    NEW.offer_number := public.generate_offer_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_offer_number_trigger
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_offer_number();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to log offer activities
CREATE OR REPLACE FUNCTION public.log_offer_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_title TEXT;
  activity_description TEXT;
  activity_metadata JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    activity_title := 'Offer ' || NEW.offer_number || ' created';
    activity_description := 'New offer created with amount ' || NEW.amount;
    activity_metadata := jsonb_build_object(
      'offer_id', NEW.id,
      'offer_number', NEW.offer_number,
      'amount', NEW.amount,
      'factor_rate', NEW.factor_rate,
      'version', NEW.version
    );
    
    INSERT INTO public.deal_activities (
      deal_id, user_id, activity_type, category, title, description, metadata
    ) VALUES (
      NEW.deal_id, NEW.user_id, 'auto', 'offer_created', activity_title, activity_description, activity_metadata
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changed activity
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      activity_title := 'Offer status changed to ' || NEW.status;
      activity_description := 'Offer ' || NEW.offer_number || ' status changed from ' || OLD.status || ' to ' || NEW.status;
      activity_metadata := jsonb_build_object(
        'offer_id', NEW.id,
        'offer_number', NEW.offer_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      );
      
      INSERT INTO public.deal_activities (
        deal_id, user_id, activity_type, category, title, description, metadata
      ) VALUES (
        NEW.deal_id, NEW.user_id, 'auto', 'offer_status_changed', activity_title, activity_description, activity_metadata
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_offer_activity_trigger
  AFTER INSERT OR UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_offer_activity();
