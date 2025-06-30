
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="bg-slate-50 border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-800 text-sm font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 h-auto"
          onClick={onUploadDocument}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 text-sm py-2 h-auto"
          onClick={onAddNote}
        >
          <FileText className="h-4 w-4 mr-2" />
          Add Note
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 text-sm py-2 h-auto"
          onClick={onChangeStage}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Change Stage
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 text-sm py-2 h-auto"
          onClick={onGenerateOffer}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Generate Offer
        </Button>
      </CardContent>
    </Card>
  );
};

export default DealActionButtons;
