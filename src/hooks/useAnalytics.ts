
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DateRange {
  from: Date;
  to: Date;
}

export const useAnalytics = (dateRange: DateRange) => {
  const { user } = useAuth();

  const fetchAnalyticsData = async () => {
    if (!user?.id) return null;

    try {
      console.log('Starting analytics data fetch...');
      
      // Fetch all deals within date range
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (dealsError) {
        console.error('Deals fetch error:', dealsError);
        throw dealsError;
      }

      console.log('Deals fetched successfully:', deals?.length || 0);

      // Fetch offers for conversion calculations
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (offersError) {
        console.error('Offers fetch error:', offersError);
        // Don't throw, just log and continue with empty offers
      }

      console.log('Offers fetched:', offers?.length || 0);

      // Fetch ISOs for performance calculations
      const { data: isos, error: isosError } = await supabase
        .from('isos')
        .select('*')
        .eq('user_id', user.id);

      if (isosError) {
        console.error('ISOs fetch error:', isosError);
        // Don't throw, just log and continue with empty ISOs
      }

      console.log('ISOs fetched:', isos?.length || 0);

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

      // Calculate ISO performance data
      const isoPerformanceData = (isos || []).map(iso => {
        const isoDeals = deals?.filter(deal => deal.iso_id === iso.id) || [];
        const isoFundedDeals = isoDeals.filter(deal => deal.stage === 'Funded');
        const totalRevenue = isoFundedDeals.reduce((sum, deal) => sum + (deal.amount_requested || 0), 0);
        
        const isoOffers = offers?.filter(offer => {
          const dealId = offer.deal_id;
          return isoDeals.some(deal => deal.id === dealId);
        }) || [];
        
        const totalCommission = isoOffers.reduce((sum, offer) => {
          const commissionRate = offer.iso_commission_rate || iso.commission_rate || 0.05;
          return sum + (offer.amount * commissionRate);
        }, 0);

        const conversionRate = isoDeals.length > 0 ? Math.round((isoFundedDeals.length / isoDeals.length) * 100) : 0;

        return {
          name: iso.iso_name,
          deals: isoFundedDeals.length,
          revenue: totalRevenue,
          commission: totalCommission,
          conversionRate
        };
      }).filter(iso => iso.deals > 0)
        .sort((a, b) => b.deals - a.deals);

      console.log('Analytics data processed successfully');

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
    } catch (error) {
      console.error('Analytics fetch failed:', error);
      throw error;
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', user?.id, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: fetchAnalyticsData,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
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
