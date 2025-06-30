
-- Complete Database Setup Script for MCA CRM System
-- Execute this script in your Supabase SQL Editor to set up the entire database

-- Step 1: Create the update_updated_at_column function (needed by other migrations)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Step 2: Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_role TEXT DEFAULT 'Agent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- Step 3: Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  dba_name TEXT,
  industry TEXT,
  years_in_business INTEGER,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 4: Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Create ISOs table
CREATE TABLE public.isos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iso_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  commission_rate DECIMAL(5,4) DEFAULT 0.05,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 6: Create deals table with all fields
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_number TEXT NOT NULL UNIQUE DEFAULT '',
  company_name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  amount_requested NUMERIC NOT NULL,
  monthly_revenue NUMERIC,
  average_daily_balance NUMERIC,
  credit_score INTEGER,
  factor_rate NUMERIC DEFAULT 1.25,
  term_months INTEGER DEFAULT 12,
  stage TEXT NOT NULL DEFAULT 'New',
  underwriting_status TEXT DEFAULT 'pending',
  decline_reason TEXT,
  underwriting_notes TEXT,
  underwriter_id UUID,
  underwriting_date TIMESTAMP WITH TIME ZONE,
  iso_id UUID REFERENCES public.isos(id),
  iso_name TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 7: Create deal activities table
CREATE TABLE public.deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('auto', 'manual')),
  category TEXT NOT NULL CHECK (category IN ('deal_created', 'stage_changed', 'document_uploaded', 'field_updated', 'note', 'call', 'email', 'offer_created', 'offer_status_changed')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  mentioned_users UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create deal documents table
CREATE TABLE public.deal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  document_category TEXT NOT NULL CHECK (document_category IN ('Bank Statement', 'Tax Return', 'Driver License', 'Other')),
  upload_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'processed', 'error')),
  ocr_status TEXT DEFAULT NULL CHECK (ocr_status IN (NULL, 'pending', 'processing', 'completed', 'failed')),
  ocr_data JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 9: Create underwriting checklist table
CREATE TABLE public.deal_underwriting_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  documents_complete BOOLEAN DEFAULT FALSE,
  bank_statements_reviewed BOOLEAN DEFAULT FALSE,
  credit_checked BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID NOT NULL,
  user_id UUID NOT NULL
);

-- Step 10: Create offers table
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
  iso_commission_rate DECIMAL(5,4),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined')),
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 11: Create audit log table
CREATE TABLE public.deal_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 12: Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.isos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_underwriting_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_audit_log ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS policies for companies
CREATE POLICY "Users can view their own companies" 
  ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own companies" 
  ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" 
  ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own companies" 
  ON public.companies FOR DELETE USING (auth.uid() = user_id);

-- Step 14: Create RLS policies for contacts
CREATE POLICY "Users can view their own contacts" 
  ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contacts" 
  ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" 
  ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" 
  ON public.contacts FOR DELETE USING (auth.uid() = user_id);

-- Step 15: Create RLS policies for ISOs
CREATE POLICY "Users can view their own ISOs" 
  ON public.isos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ISOs" 
  ON public.isos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ISOs" 
  ON public.isos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ISOs" 
  ON public.isos FOR DELETE USING (auth.uid() = user_id);

-- Step 16: Create RLS policies for deals
CREATE POLICY "Users can view their own deals" 
  ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deals" 
  ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deals" 
  ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deals" 
  ON public.deals FOR DELETE USING (auth.uid() = user_id);

-- Step 17: Create RLS policies for deal activities
CREATE POLICY "Users can view activities for their deals" 
  ON public.deal_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND deals.user_id = auth.uid())
  );
CREATE POLICY "Users can create activities for their deals" 
  ON public.deal_activities FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND deals.user_id = auth.uid())
  );

-- Step 18: Create RLS policies for deal documents
CREATE POLICY "Users can view their own deal documents"
  ON public.deal_documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own deal documents"
  ON public.deal_documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own deal documents"
  ON public.deal_documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own deal documents"
  ON public.deal_documents FOR DELETE USING (user_id = auth.uid());

-- Step 19: Create RLS policies for underwriting checklist
CREATE POLICY "Users can view their own deal checklists" 
  ON public.deal_underwriting_checklist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deal checklists" 
  ON public.deal_underwriting_checklist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deal checklists" 
  ON public.deal_underwriting_checklist FOR UPDATE USING (auth.uid() = user_id);

-- Step 20: Create RLS policies for offers
CREATE POLICY "Users can view their own offers" 
  ON public.offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own offers" 
  ON public.offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own offers" 
  ON public.offers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own offers" 
  ON public.offers FOR DELETE USING (auth.uid() = user_id);

-- Step 21: Create RLS policies for audit log
CREATE POLICY "Users can view their own deal audit logs" 
  ON public.deal_audit_log FOR SELECT USING (auth.uid() = user_id);

-- Step 22: Create deal number generation function
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
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(d.deal_number, '-', 3) AS INTEGER)), 0
  ) + 1
  INTO next_number
  FROM public.deals d
  WHERE d.deal_number LIKE 'MCA-' || current_year || '-%';
  
  new_deal_number := 'MCA-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_deal_number;
END;
$$;

-- Step 23: Create offer number generation function
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
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(o.offer_number, '-', 3) AS INTEGER)), 0
  ) + 1
  INTO next_number
  FROM public.offers o
  WHERE o.offer_number LIKE 'OFF-' || current_year || '-%';
  
  offer_number := 'OFF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN offer_number;
END;
$$;

-- Step 24: Create trigger functions for auto-numbering
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

-- Step 25: Create activity logging functions
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
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

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

-- Step 26: Create sync functions for company and ISO names
CREATE OR REPLACE FUNCTION sync_company_name_to_deals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    UPDATE public.deals 
    SET company_name = NEW.company_name,
        updated_at = NOW()
    WHERE company_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_iso_name_to_deals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.iso_name IS DISTINCT FROM NEW.iso_name THEN
    UPDATE public.deals 
    SET iso_name = NEW.iso_name,
        updated_at = NOW()
    WHERE iso_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 27: Create all triggers
CREATE TRIGGER set_deal_number_trigger
  BEFORE INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deal_number();

CREATE TRIGGER set_offer_number_trigger
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_offer_number();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_isos_updated_at 
  BEFORE UPDATE ON public.isos 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_documents_updated_at
  BEFORE UPDATE ON public.deal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER deal_activity_trigger
  AFTER INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.log_deal_activity();

CREATE TRIGGER log_offer_activity_trigger
  AFTER INSERT OR UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_offer_activity();

CREATE TRIGGER sync_company_name_trigger
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_name_to_deals();

CREATE TRIGGER sync_iso_name_to_deals_trigger
  AFTER UPDATE ON public.isos
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_iso_name_to_deals();

-- Create trigger for checklist updates
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

-- Step 28: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_updated_at ON public.deals(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON public.deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON public.deal_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_documents_deal_id ON public.deal_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_documents_user_id ON public.deal_documents(user_id);

-- Step 29: Add data constraints
ALTER TABLE public.deals ADD CONSTRAINT check_amount_positive CHECK (amount_requested > 0);
ALTER TABLE public.deals ADD CONSTRAINT check_valid_stage CHECK (stage IN ('New', 'Reviewing Documents', 'Underwriting', 'Offer Sent', 'Funded', 'Declined'));
ALTER TABLE public.deals ADD CONSTRAINT check_valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE public.deals ADD CONSTRAINT credit_score_range CHECK (credit_score IS NULL OR (credit_score >= 300 AND credit_score <= 850));
ALTER TABLE public.deals ADD CONSTRAINT factor_rate_minimum CHECK (factor_rate IS NULL OR factor_rate >= 1.0);
ALTER TABLE public.deals ADD CONSTRAINT term_months_positive CHECK (term_months IS NULL OR term_months > 0);
ALTER TABLE public.deals ADD CONSTRAINT deals_underwriting_status_check CHECK (underwriting_status IN ('pending', 'approved', 'declined', 'more_info_needed'));

-- Ensure only one primary contact per company
CREATE UNIQUE INDEX idx_unique_primary_contact 
  ON public.contacts(company_id) 
  WHERE is_primary = true;

-- Step 30: Create soft delete and restore functions
CREATE OR REPLACE FUNCTION public.soft_delete_deal(deal_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.deals 
  SET deleted_at = now() 
  WHERE id = deal_id AND user_id = auth.uid() AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.restore_deal(deal_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.deals 
  SET deleted_at = NULL 
  WHERE id = deal_id AND user_id = auth.uid() AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage Setup for deal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for deal documents
CREATE POLICY "Users can upload their own deal documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own deal documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deal-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own deal documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'deal-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own deal documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'deal-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

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
CREATE TRIGGER document_activity_trigger
  AFTER INSERT ON public.deal_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_activity();

-- Setup complete! Your MCA CRM database is now ready.
SELECT 'Database setup completed successfully!' as status;
