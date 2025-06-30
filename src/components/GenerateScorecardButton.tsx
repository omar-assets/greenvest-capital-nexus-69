
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useScorecard } from '@/hooks/useScorecard';
import { useScorecardPolling } from '@/hooks/useScorecardPolling';

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
  const [scorecardId, setScorecardId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  const { status: pollingStatus, isPolling } = useScorecardPolling({
    scorecardId: scorecardId || '',
    enabled: !!scorecardId && requestStatus === 'processing',
    onStatusChange: (status) => {
      if (status === 'completed') {
        setRequestStatus('completed');
        // Reset after showing success for a few seconds
        setTimeout(() => {
          setRequestStatus('idle');
          setScorecardId(null);
        }, 3000);
      } else if (status === 'error') {
        setRequestStatus('error');
        // Reset after showing error for a few seconds
        setTimeout(() => {
          setRequestStatus('idle');
          setScorecardId(null);
        }, 5000);
      }
    }
  });

  const handleGetScorecard = async () => {
    if (!external_app_id) {
      console.warn('No external app ID available for scorecard request');
      return;
    }

    try {
      setRequestStatus('idle');
      console.log('Initiating scorecard request for app_id:', external_app_id);
      
      // Use a promise-based approach to handle the mutation
      const result = await new Promise<any>((resolve, reject) => {
        getScorecard(
          {
            company_id,
            deal_id,
            external_app_id
          },
          {
            onSuccess: (data) => resolve(data),
            onError: (error) => reject(error)
          }
        );
      });
      
      if (result?.scorecard_id) {
        setScorecardId(result.scorecard_id);
        
        if (result.status === 'processing') {
          setRequestStatus('processing');
        } else if (result.status === 'completed') {
          setRequestStatus('completed');
          setTimeout(() => {
            setRequestStatus('idle');
            setScorecardId(null);
          }, 3000);
        }
      }
      
      console.log('Scorecard request initiated successfully');
    } catch (error) {
      console.error('Scorecard request failed:', error);
      setRequestStatus('error');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setRequestStatus('idle');
        setScorecardId(null);
      }, 5000);
    }
  };

  const isDisabled = disabled || isGettingScorecard || !external_app_id || isPolling;

  // Determine button appearance based on status
  const getButtonContent = () => {
    if (isGettingScorecard) {
      return (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Starting...
        </>
      );
    }
    
    if (requestStatus === 'processing' || isPolling) {
      return (
        <>
          <Clock className="h-4 w-4 mr-2 animate-pulse" />
          Processing...
        </>
      );
    }
    
    if (requestStatus === 'completed') {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Completed
        </>
      );
    }
    
    if (requestStatus === 'error') {
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
      return 'Starting scorecard request...';
    }
    
    if (requestStatus === 'processing' || isPolling) {
      return 'Scorecard is being processed - this may take a few minutes';
    }
    
    if (requestStatus === 'completed') {
      return 'Scorecard completed successfully';
    }
    
    if (requestStatus === 'error') {
      return 'Last request failed - click to retry';
    }
    
    return 'Get scorecard for this application';
  };

  const getButtonVariant = () => {
    if (requestStatus === 'error') return 'destructive';
    if (requestStatus === 'processing' || isPolling) return 'secondary';
    if (requestStatus === 'completed') return 'default';
    return variant;
  };

  return (
    <Button
      variant={getButtonVariant()}
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
