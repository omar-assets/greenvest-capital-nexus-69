
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DateRange {
  from: Date;
  to: Date;
}

interface BasicKPIData {
  totalPipelineValue: number;
  dealsFundedThisMonth: number;
  averageDealSize: number;
  conversionRate: number;
}

interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

interface FundingTrendsData {
  date: string;
  deals: number;
  amount: number;
}

interface ISOPerformanceData {
  name: string;
  deals: number;
  revenue: number;
  commission: number;
  conversionRate: number;
}

export const useBasicAnalytics = (dateRange: DateRange) => {
  const { user } = useAuth();

  // Fetch deals data
  const { data: dealsData, isLoading: dealsLoading, error: dealsError } = useQuery({
    queryKey: ['analytics-deals', user?.id, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      console.log('Fetching deals data...');
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) {
        console.error('Deals query error:', error);
        throw error;
      }

      console.log('Deals data fetched:', data?.length || 0, 'deals');
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch offers data
  const { data: offersData, isLoading: offersLoading, error: offersError } = useQuery({
    queryKey: ['analytics-offers', user?.id, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      console.log('Fetching offers data...');
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) {
        console.error('Offers query error:', error);
        throw error;
      }

      console.log('Offers data fetched:', data?.length || 0, 'offers');
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch ISOs data
  const { data: isosData, isLoading: isosLoading, error: isosError } = useQuery({
    queryKey: ['analytics-isos', user?.id],
    queryFn: async () => {
      console.log('Fetching ISOs data...');
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('isos')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('ISOs query error:', error);
        throw error;
      }

      console.log('ISOs data fetched:', data?.length || 0, 'ISOs');
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  // Calculate KPI data
  const kpiData: BasicKPIData = {
    totalPipelineValue: dealsData?.reduce((sum, deal) => sum + (deal.amount_requested || 0), 0) || 0,
    dealsFundedThisMonth: dealsData?.filter(deal => deal.stage === 'Funded').reduce((sum, deal) => sum + (deal.amount_requested || 0), 0) || 0,
    averageDealSize: dealsData && dealsData.length > 0 ? 
      dealsData.reduce((sum, deal) => sum + (deal.amount_requested || 0), 0) / dealsData.length : 0,
    conversionRate: dealsData && dealsData.length > 0 ? 
      Math.round((dealsData.filter(deal => deal.stage === 'Funded').length / dealsData.length) * 100) : 0
  };

  // Calculate pipeline data
  const pipelineData: PipelineData[] = dealsData ? 
    Object.entries(
      dealsData.reduce((acc, deal) => {
        const stage = deal.stage || 'New';
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0 };
        }
        acc[stage].count++;
        acc[stage].value += deal.amount_requested || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>)
    ).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value
    })) : [];

  // Generate funding trends data
  const fundingTrendsData: FundingTrendsData[] = [];
  const fundedDeals = dealsData?.filter(deal => deal.stage === 'Funded') || [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
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
  const isoPerformanceData: ISOPerformanceData[] = (isosData || []).map(iso => {
    const isoDeals = dealsData?.filter(deal => deal.iso_id === iso.id) || [];
    const isoFundedDeals = isoDeals.filter(deal => deal.stage === 'Funded');
    const totalRevenue = isoFundedDeals.reduce((sum, deal) => sum + (deal.amount_requested || 0), 0);
    
    const isoOffers = offersData?.filter(offer => {
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

  return {
    kpiData,
    pipelineData,
    fundingTrendsData,
    isoPerformanceData,
    isLoading: dealsLoading || offersLoading || isosLoading,
    hasDealsData: !dealsLoading && !dealsError && !!dealsData,
    hasOffersData: !offersLoading && !offersError && !!offersData,
    hasIsosData: !isosLoading && !isosError && !!isosData,
    errors: {
      deals: dealsError,
      offers: offersError,
      isos: isosError
    }
  };
};
