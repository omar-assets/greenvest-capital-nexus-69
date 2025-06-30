
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
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onUploadDocument}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
          onClick={onAddNote}
        >
          <FileText className="h-4 w-4 mr-2" />
          Add Note
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
          onClick={onChangeStage}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Change Stage
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
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
