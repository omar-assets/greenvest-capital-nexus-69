
import { useState } from 'react';
import DocumentGrid from './DocumentGrid';
import DocumentDropzone from './DocumentDropzone';
import { useDealDocuments } from '@/hooks/useDealDocuments';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];

interface DealDocumentsProps {
  dealId: string;
}

const DealDocuments = ({ dealId }: DealDocumentsProps) => {
  const { toast } = useToast();
  const [viewingDocument, setViewingDocument] = useState<DealDocument | null>(null);
  
  const {
    documents,
    isLoading,
    uploadDocument,
    isUploading,
    deleteDocument,
    isDeleting,
    getDownloadUrl,
  } = useDealDocuments(dealId);

  const handleView = async (document: DealDocument) => {
    try {
      const url = await getDownloadUrl(document.file_path);
      window.open(url, '_blank');
      setViewingDocument(document);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (document: DealDocument) => {
    try {
      const url = await getDownloadUrl(document.file_path);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleProcessOCR = (documentId: string) => {
    // OCR processing logic would go here
    toast({
      title: "OCR Processing",
      description: "OCR processing functionality not yet implemented",
    });
  };

  const handleUpload = ({ file, category, onProgress }: { file: File; category: string; onProgress?: (progress: number) => void }) => {
    uploadDocument({ file, category, onProgress });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentDropzone onUpload={handleUpload} isUploading={isUploading} />
      <DocumentGrid
        documents={documents}
        onView={handleView}
        onDownload={handleDownload}
        onDelete={deleteDocument}
        onProcessOCR={handleProcessOCR}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default DealDocuments;
