
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
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
  const [lastRequestStatus, setLastRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGetScorecard = async () => {
    if (!external_app_id) {
      console.warn('No external app ID available for scorecard request');
      return;
    }

    try {
      setLastRequestStatus('idle');
      console.log('Initiating scorecard request for app_id:', external_app_id);
      
      await getScorecard({
        company_id,
        deal_id,
        external_app_id
      });
      
      setLastRequestStatus('success');
      console.log('Scorecard request completed successfully');
      
      // Reset status after 3 seconds
      setTimeout(() => setLastRequestStatus('idle'), 3000);
    } catch (error) {
      console.error('Scorecard request failed:', error);
      setLastRequestStatus('error');
      
      // Reset status after 5 seconds
      setTimeout(() => setLastRequestStatus('idle'), 5000);
    }
  };

  const isDisabled = disabled || isGettingScorecard || !external_app_id;

  // Determine button appearance based on status
  const getButtonContent = () => {
    if (isGettingScorecard) {
      return (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      );
    }
    
    if (lastRequestStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Success
        </>
      );
    }
    
    if (lastRequestStatus === 'error') {
      return (
        <>
          <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
          Failed - Retry?
        </>
      );
    }
    
    return (
      <>
        <FileText className="h-4 w-4 mr-2" />
        Get Scorecard
      </>
    );
  };

  const getButtonTitle = () => {
    if (!external_app_id) {
      return 'No app ID available - cannot access scorecard';
    }
    
    if (isGettingScorecard) {
      return 'Processing scorecard request...';
    }
    
    if (lastRequestStatus === 'success') {
      return 'Scorecard retrieved successfully';
    }
    
    if (lastRequestStatus === 'error') {
      return 'Last request failed - click to retry';
    }
    
    return 'Get scorecard for this application';
  };

  return (
    <Button
      variant={lastRequestStatus === 'error' ? 'destructive' : variant}
      size={size}
      disabled={isDisabled}
      onClick={handleGetScorecard}
      className={`transition-all duration-200 hover:shadow-sm ${className}`}
      title={getButtonTitle()}
    >
      {getButtonContent()}
    </Button>
  );
};

export default GenerateScorecardButton;
