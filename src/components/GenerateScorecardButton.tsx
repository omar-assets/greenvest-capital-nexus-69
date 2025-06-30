
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader, Download } from 'lucide-react';
import { useScorecard } from '@/hooks/useScorecard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GenerateScorecardButtonProps {
  company_id: string;
  deal_id?: string;
  external_app_id?: number;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
}

const GenerateScorecardButton = ({
  company_id,
  deal_id,
  external_app_id,
  variant = 'outline',
  size = 'sm',
  disabled = false,
  className = ''
}: GenerateScorecardButtonProps) => {
  const { generateScorecard, isGenerating, getScorecard, isGettingScorecard } = useScorecard();

  const handleGenerateScorecard = () => {
    if (!external_app_id) {
      alert('No external app ID found for this company. Cannot generate scorecard.');
      return;
    }

    generateScorecard({
      company_id,
      deal_id,
      external_app_id
    });
  };

  const handleGetScorecard = () => {
    if (!external_app_id) {
      alert('No external app ID found for this company. Cannot retrieve scorecard.');
      return;
    }

    getScorecard({ external_app_id });
  };

  const isDisabled = disabled || isGenerating || isGettingScorecard || !external_app_id;
  const isLoading = isGenerating || isGettingScorecard;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className={`transition-all duration-200 hover:shadow-sm ${className}`}
          title={
            !external_app_id 
              ? 'No app ID available - cannot access scorecard'
              : isLoading 
                ? 'Processing...'
                : 'Scorecard options'
          }
        >
          {isLoading ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : isGettingScorecard ? 'Getting...' : 'Scorecard'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white shadow-lg border">
        <DropdownMenuItem 
          onClick={handleGenerateScorecard} 
          disabled={isDisabled}
          className="hover:bg-muted/50 transition-colors"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate New Scorecard
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleGetScorecard} 
          disabled={isDisabled}
          className="hover:bg-muted/50 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Get Existing Scorecard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GenerateScorecardButton;
