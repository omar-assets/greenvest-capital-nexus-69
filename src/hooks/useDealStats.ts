
import { useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

export const useDealStats = (deals: Deal[]) => {
  return useMemo(() => {
    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + deal.amount_requested, 0);
    
    // Calculate average days in pipeline
    const avgDaysInPipeline = deals.length > 0 
      ? Math.round(
          deals.reduce((sum, deal) => {
            const days = Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / deals.length
        )
      : 0;

    return {
      totalDeals,
      totalValue,
      avgDaysInPipeline
    };
  }, [deals]);
};
