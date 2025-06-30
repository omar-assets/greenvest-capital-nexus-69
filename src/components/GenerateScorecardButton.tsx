
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
  const { getScorecard, isGettingScorecard } = useScorecard();

  const handleGetScorecard = () => {
    if (!external_app_id) {
      alert('No external app ID found for this company. Cannot process scorecard request.');
      return;
    }

    getScorecard({
      company_id,
      deal_id,
      external_app_id
    });
  };

  const isDisabled = disabled || isGettingScorecard || !external_app_id;

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isDisabled}
      onClick={handleGetScorecard}
      className={`transition-all duration-200 hover:shadow-sm ${className}`}
      title={
        !external_app_id 
          ? 'No app ID available - cannot access scorecard'
          : isGettingScorecard 
            ? 'Processing...'
            : 'Get scorecard for this application'
      }
    >
      {isGettingScorecard ? (
        <Loader className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {isGettingScorecard ? 'Processing...' : 'Get Scorecard'}
    </Button>
  );
};

export default GenerateScorecardButton;
