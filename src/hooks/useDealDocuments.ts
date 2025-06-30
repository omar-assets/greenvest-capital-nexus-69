
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];
type DealDocumentInsert = Database['public']['Tables']['deal_documents']['Insert'];

export const useDealDocuments = (dealId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents for a deal
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['deal-documents', dealId],
    queryFn: async () => {
      if (!user?.id || !dealId) return [];
      
      const { data, error } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DealDocument[];
    },
    enabled: !!user?.id && !!dealId,
  });

  // Upload document mutation
  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      category, 
      onProgress 
    }: { 
      file: File; 
      category: string;
      onProgress?: (progress: number) => void;
    }) => {
      if (!user?.id || !dealId) throw new Error('User not authenticated or deal ID missing');

      // Validate file type and size
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/deals/${dealId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { data: documentData, error: documentError } = await supabase
        .from('deal_documents')
        .insert({
          deal_id: dealId,
          user_id: user.id,
          filename: fileName,
          original_filename: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          document_category: category,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (documentError) throw documentError;
      return documentData as DealDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-documents', dealId] });
      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document.",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get document details first
      const { data: document, error: fetchError } = await supabase
        .from('deal_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('deal-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('deal_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-documents', dealId] });
      toast({
        title: "Document Deleted",
        description: "Document has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    },
  });

  // Get download URL for a document
  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('deal-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents,
    isLoading,
    refetch,
    uploadDocument: uploadDocument.mutate,
    isUploading: uploadDocument.isPending,
    deleteDocument: deleteDocument.mutate,
    isDeleting: deleteDocument.isPending,
    getDownloadUrl,
  };
};
