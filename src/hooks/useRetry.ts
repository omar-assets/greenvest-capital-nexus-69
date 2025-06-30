
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  onRetry?: (attempt: number) => void;
  onMaxAttemptsReached?: () => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  canRetry: boolean;
}

export const useRetry = (options: RetryOptions = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBase = 2,
    onRetry,
    onMaxAttemptsReached
  } = options;

  const { toast } = useToast();
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    canRetry: true
  });

  const calculateDelay = useCallback((attempt: number) => {
    const delay = Math.min(baseDelay * Math.pow(exponentialBase, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, [baseDelay, exponentialBase, maxDelay]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({ ...prev, isRetrying: attempt > 0, attempt }));
        
        if (attempt > 0) {
          onRetry?.(attempt);
          const delay = calculateDelay(attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await operation();
        setRetryState({ isRetrying: false, attempt: 0, canRetry: true });
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed for ${operationName || 'operation'}:`, error);
        
        if (attempt < maxAttempts - 1) {
          toast({
            title: "Retrying...",
            description: `Attempt ${attempt + 2} of ${maxAttempts}`,
            duration: 2000,
          });
        }
      }
    }

    setRetryState({ isRetrying: false, attempt: maxAttempts, canRetry: false });
    onMaxAttemptsReached?.();
    
    toast({
      title: "Operation Failed",
      description: `Failed after ${maxAttempts} attempts. Please try again later.`,
      variant: "destructive",
    });

    throw lastError!;
  }, [maxAttempts, calculateDelay, onRetry, onMaxAttemptsReached, toast]);

  const reset = useCallback(() => {
    setRetryState({ isRetrying: false, attempt: 0, canRetry: true });
  }, []);

  return {
    retry,
    reset,
    ...retryState
  };
};
