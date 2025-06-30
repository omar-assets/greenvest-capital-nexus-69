
import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScorecardPollingOptions {
  scorecardId: string;
  enabled?: boolean;
  onStatusChange?: (status: string) => void;
}

export const useScorecardPolling = ({ 
  scorecardId, 
  enabled = true,
  onStatusChange 
}: ScorecardPollingOptions) => {
  const [status, setStatus] = useState<string>('processing');
  const [isPolling, setIsPolling] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkScorecardStatus = useCallback(async () => {
    if (!scorecardId || !enabled) return;

    try {
      const { data: scorecard, error } = await supabase
        .from('scorecards')
        .select('status, error_message, completed_at')
        .eq('id', scorecardId)
        .single();

      if (error) {
        console.error('Error checking scorecard status:', error);
        return;
      }

      if (scorecard) {
        const newStatus = scorecard.status;
        setStatus(newStatus);
        onStatusChange?.(newStatus);

        if (newStatus === 'completed') {
          setIsPolling(false);
          queryClient.invalidateQueries({ queryKey: ['scorecards'] });
          queryClient.invalidateQueries({ queryKey: ['scorecard', scorecardId] });
          queryClient.invalidateQueries({ queryKey: ['scorecard-sections', scorecardId] });
          
          toast({
            title: "Scorecard Ready",
            description: "Your scorecard has been processed and is ready to view.",
          });
        } else if (newStatus === 'error') {
          setIsPolling(false);
          toast({
            title: "Scorecard Processing Failed",
            description: scorecard.error_message || "An error occurred while processing the scorecard.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error in scorecard polling:', error);
    }
  }, [scorecardId, enabled, onStatusChange, queryClient, toast]);

  useEffect(() => {
    if (!enabled || !scorecardId) return;

    // Start polling
    setIsPolling(true);
    
    // Check immediately
    checkScorecardStatus();
    
    // Set up polling interval (every 3 seconds)
    const interval = setInterval(checkScorecardStatus, 3000);
    
    // Stop polling after 5 minutes to prevent infinite polling
    const timeout = setTimeout(() => {
      setIsPolling(false);
      clearInterval(interval);
      toast({
        title: "Scorecard Processing Timeout",
        description: "The scorecard is taking longer than expected. Please refresh to check status.",
        variant: "destructive",
      });
    }, 300000); // 5 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [enabled, scorecardId, checkScorecardStatus, toast]);

  // Stop polling when status is final
  useEffect(() => {
    if (status === 'completed' || status === 'error') {
      setIsPolling(false);
    }
  }, [status]);

  return {
    status,
    isPolling,
    checkStatus: checkScorecardStatus
  };
};
