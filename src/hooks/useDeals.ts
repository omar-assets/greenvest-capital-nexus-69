
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];
type DealInsert = Database['public']['Tables']['deals']['Insert'];
type DealUpdate = Database['public']['Tables']['deals']['Update'];

export const useDeals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all deals for the current user
  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!user?.id,
  });

  // Create deal mutation
  const createDeal = useMutation({
    mutationFn: async (dealData: Omit<DealInsert, 'user_id' | 'id' | 'deal_number' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Deal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', data.id] });
      toast({
        title: "Deal Created",
        description: `Deal ${data.deal_number} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating deal:', error);
    },
  });

  return {
    deals,
    isLoading,
    error,
    createDeal: createDeal.mutate,
    isCreating: createDeal.isPending,
  };
};

export const useDeal = (dealId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      if (!user?.id || !dealId) return null;
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Deal;
    },
    enabled: !!user?.id && !!dealId,
  });
};

export const useDealStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deal-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return {
        totalDeals: 0,
        inProgress: 0,
        fundedThisMonth: 0,
        conversionRate: 0,
      };

      // Get all deals
      const { data: allDeals, error: allDealsError } = await supabase
        .from('deals')
        .select('stage, amount_requested, created_at')
        .eq('user_id', user.id);

      if (allDealsError) throw allDealsError;

      const totalDeals = allDeals?.length || 0;
      const inProgress = allDeals?.filter(deal => 
        deal.stage !== 'Funded' && deal.stage !== 'Declined'
      ).length || 0;

      // Calculate funded this month
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const fundedThisMonth = allDeals?.filter(deal => 
        deal.stage === 'Funded' && 
        new Date(deal.created_at) >= startOfMonth
      ).reduce((sum, deal) => sum + (deal.amount_requested || 0), 0) || 0;

      // Calculate conversion rate
      const funded = allDeals?.filter(deal => deal.stage === 'Funded').length || 0;
      const conversionRate = totalDeals > 0 ? Math.round((funded / totalDeals) * 100) : 0;

      return {
        totalDeals,
        inProgress,
        fundedThisMonth,
        conversionRate,
      };
    },
    enabled: !!user?.id,
  });
};
