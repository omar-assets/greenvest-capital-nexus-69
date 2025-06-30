
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRetry } from '@/hooks/useRetry';
import { formatCurrency } from '@/utils/offerUtils';

interface DateRange {
  from: Date;
  to: Date;
}

export const useAnalytics = (dateRange: DateRange) => {
  const { user } = useAuth();
  const { retry } = useRetry();

  const fetchAnalyticsData = async () => {
    if (!user?.id) return null;

    return retry(async () => {
      // Fetch all deals within date range
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (dealsError) throw dealsError;

      // Fetch offers for conversion calculations
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (offersError) throw offersError;

      // Calculate KPIs
      const totalPipelineValue = deals?.reduce((sum, deal) => sum + (deal.amount_requested || 0), 0) || 0;
      const fundedDeals = deals?.filter(deal => deal.stage === 'Funded') || [];
      const dealsFundedThisMonth = fundedDeals.reduce((sum, deal) => sum + (deal.amount_requested || 0), 0);
      const averageDealSize = deals && deals.length > 0 ? totalPipelineValue / deals.length : 0;
      const conversionRate = deals && deals.length > 0 ? Math.round((fundedDeals.length / deals.length) * 100) : 0;

      // Group deals by stage for pipeline chart
      const stageGroups = deals?.reduce((acc, deal) => {
        const stage = deal.stage || 'New';
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0 };
        }
        acc[stage].count++;
        acc[stage].value += deal.amount_requested || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>) || {};

      const pipelineData = Object.entries(stageGroups).map(([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value
      }));

      // Generate funding trends data (daily for last 30 days)
      const fundingTrendsData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayFunded = fundedDeals.filter(deal => {
          const dealDate = new Date(deal.created_at);
          return dealDate >= dayStart && dealDate <= dayEnd;
        });

        fundingTrendsData.push({
          date: dayStart.toISOString().split('T')[0],
          deals: dayFunded.length,
          amount: dayFunded.reduce((sum, deal) => sum + (deal.amount_requested || 0), 0)
        });
      }

      // Mock ISO performance data (since we don't have ISO tracking yet)
      const isoPerformanceData = [
        { name: 'John Smith', deals: 15, revenue: 450000, commission: 22500, conversionRate: 85 },
        { name: 'Sarah Johnson', deals: 12, revenue: 380000, commission: 19000, conversionRate: 78 },
        { name: 'Mike Davis', deals: 10, revenue: 295000, commission: 14750, conversionRate: 72 },
        { name: 'Lisa Chen', deals: 8, revenue: 240000, commission: 12000, conversionRate: 68 },
        { name: 'Tom Wilson', deals: 6, revenue: 180000, commission: 9000, conversionRate: 65 }
      ];

      return {
        kpiData: {
          totalPipelineValue,
          dealsFundedThisMonth,
          averageDealSize,
          conversionRate
        },
        pipelineData,
        fundingTrendsData,
        isoPerformanceData
      };
    }, 'fetch analytics data');
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', user?.id, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: fetchAnalyticsData,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    kpiData: data?.kpiData || { totalPipelineValue: 0, dealsFundedThisMonth: 0, averageDealSize: 0, conversionRate: 0 },
    pipelineData: data?.pipelineData || [],
    fundingTrendsData: data?.fundingTrendsData || [],
    isoPerformanceData: data?.isoPerformanceData || [],
    isLoading,
    error
  };
};
