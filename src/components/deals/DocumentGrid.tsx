
import React from 'react';
import { FileText, Download, Eye, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/formatters';
import type { Database } from '@/integrations/supabase/types';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];

interface DocumentGridProps {
  documents: DealDocument[];
  onView: (document: DealDocument) => void;
  onDownload: (document: DealDocument) => void;
  onDelete: (documentId: string) => void;
  onProcessOCR: (documentId: string) => void;
  isDeleting: boolean;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Bank Statement':
      return 'bg-blue-100 text-blue-800';
    case 'Tax Return':
      return 'bg-green-100 text-green-800';
    case 'Driver License':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    default:
      return null;
  }
};

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onView,
  onDownload,
  onDelete,
  onProcessOCR,
  isDeleting
}) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
        <p className="text-gray-500">Upload PDF documents to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <FileText className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate" title={document.original_filename}>
                  {document.original_filename}
                </h4>
                <p className="text-sm text-gray-500">
                  {(Number(document.file_size) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Badge className={getCategoryColor(document.document_category)}>
                {document.document_category}
              </Badge>
              
              {document.ocr_status && (
                <Badge className={getStatusColor(document.ocr_status) || ''}>
                  OCR: {document.ocr_status}
                </Badge>
              )}
            </div>

            <div className="text-xs text-gray-500 mb-4">
              <p>Uploaded: {formatDate(document.created_at)}</p>
              {document.updated_at !== document.created_at && (
                <p>Updated: {formatDate(document.updated_at)}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(document)}
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(document)}
              >
                <Download className="h-3 w-3" />
              </Button>

              {!document.ocr_status && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProcessOCR(document.id)}
                  title="Process with OCR"
                >
                  <Zap className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(document.id)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DocumentGrid;
