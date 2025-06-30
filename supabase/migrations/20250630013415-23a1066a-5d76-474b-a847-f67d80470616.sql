
-- Create storage bucket for deal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false);

-- Create policies for deal documents bucket
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

-- Create documents table to track document metadata
CREATE TABLE public.deal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE
);

-- Enable RLS on documents table
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents
CREATE POLICY "Users can view their own deal documents"
ON public.deal_documents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own deal documents"
ON public.deal_documents FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own deal documents"
ON public.deal_documents FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own deal documents"
ON public.deal_documents FOR DELETE
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_deal_documents_deal_id ON public.deal_documents(deal_id);
CREATE INDEX idx_deal_documents_user_id ON public.deal_documents(user_id);
CREATE INDEX idx_deal_documents_category ON public.deal_documents(document_category);

-- Create trigger for updated_at
CREATE TRIGGER update_deal_documents_updated_at
  BEFORE UPDATE ON public.deal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
