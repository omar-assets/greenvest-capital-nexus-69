
import { Button } from '@/components/ui/button';
import { Upload, FileText, RefreshCw, DollarSign } from 'lucide-react';

interface DealActionButtonsProps {
  onUploadDocument?: () => void;
  onAddNote?: () => void;
  onChangeStage?: () => void;
  onGenerateOffer?: () => void;
}

const DealActionButtons: React.FC<DealActionButtonsProps> = ({
  onUploadDocument,
  onAddNote,
  onChangeStage,
  onGenerateOffer
}) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 h-auto justify-start font-medium"
          onClick={onUploadDocument}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
        <Button 
          variant="outline" 
          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2.5 h-auto justify-start font-medium"
          onClick={onAddNote}
        >
          <FileText className="h-4 w-4 mr-2" />
          Add Note
        </Button>
        <Button 
          variant="outline" 
          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2.5 h-auto justify-start font-medium"
          onClick={onChangeStage}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Change Stage
        </Button>
        <Button 
          variant="outline" 
          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2.5 h-auto justify-start font-medium"
          onClick={onGenerateOffer}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Generate Offer
        </Button>
      </div>
    </div>
  );
};

export default DealActionButtons;
