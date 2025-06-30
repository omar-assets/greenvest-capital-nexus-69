
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader } from 'lucide-react';
import { useScorecard } from '@/hooks/useScorecard';

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
  const { generateScorecard, isGenerating } = useScorecard();

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

  const isDisabled = disabled || isGenerating || !external_app_id;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGenerateScorecard}
      disabled={isDisabled}
      className={className}
      title={
        !external_app_id 
          ? 'No app ID available - cannot generate scorecard'
          : isGenerating 
            ? 'Generating scorecard...'
            : 'Generate financial scorecard'
      }
    >
      {isGenerating ? (
        <Loader className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {isGenerating ? 'Generating...' : 'Generate Scorecard'}
    </Button>
  );
};

export default GenerateScorecardButton;
