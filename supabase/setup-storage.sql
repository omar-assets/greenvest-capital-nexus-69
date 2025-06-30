
-- Storage Setup Script for MCA CRM Document Management
-- Execute this script in your Supabase SQL Editor after running the main database setup

-- Step 1: Create storage bucket for deal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create storage policies for deal documents
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

-- Step 3: Create function to log document upload activities
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

-- Step 4: Create trigger for document activities
CREATE TRIGGER document_activity_trigger
  AFTER INSERT ON public.deal_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_activity();

-- Step 5: Create trigger for checklist updates
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

SELECT 'Storage setup completed successfully!' as status;
