
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRetry } from '@/hooks/useRetry';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];
type DealInsert = Database['public']['Tables']['deals']['Insert'];
type DealUpdate = Database['public']['Tables']['deals']['Update'];

export const useDeals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { retry } = useRetry({
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt) => {
      console.log(`Retrying deals operation, attempt ${attempt}`);
    }
  });

  // Enhanced fetch with retry logic and soft delete filtering
  const fetchDeals = async (): Promise<Deal[]> => {
    if (!user?.id) return [];
    
    return retry(async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null) // Filter out soft deleted deals
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    }, 'fetch deals');
  };

  // Fetch all deals for the current user
  const { data: deals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: fetchDeals,
    enabled: !!user?.id,
    retry: false, // We handle retries manually
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Create deal mutation
  const createDeal = useMutation({
    mutationFn: async (dealData: Omit<DealInsert, 'user_id' | 'id' | 'deal_number' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      return retry(async () => {
        const { data, error } = await supabase
          .from('deals')
          .insert({
            ...dealData,
            user_id: user.id,
            deal_number: '', // Empty string that will be replaced by trigger
          })
          .select()
          .single();

        if (error) throw error;
        return data as Deal;
      }, 'create deal');
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

  // Update deal mutation with optimistic updates
  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updateData }: DealUpdate & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      return retry(async () => {
        const { data, error } = await supabase
          .from('deals')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data as Deal;
      }, 'update deal');
    },
    onMutate: async ({ id, ...updateData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['deals'] });

      // Snapshot previous value
      const previousDeals = queryClient.getQueryData(['deals', user?.id]) as Deal[];

      // Optimistically update
      if (previousDeals) {
        queryClient.setQueryData(['deals', user?.id], (old: Deal[]) =>
          old.map(deal => deal.id === id ? { ...deal, ...updateData } : deal)
        );
      }

      return { previousDeals };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', data.id] });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals', user?.id], context.previousDeals);
      }
      console.error('Error updating deal:', error);
    },
  });

  return {
    deals,
    isLoading,
    error,
    refetch,
    createDeal: createDeal.mutate,
    isCreating: createDeal.isPending,
    updateDeal: updateDeal.mutate,
    isUpdating: updateDeal.isPending,
    isOnline,
  };
};

export const useDeal = (dealId: string) => {
  const { user } = useAuth();
  const { retry } = useRetry();

  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      if (!user?.id || !dealId) return null;
      
      return retry(async () => {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('id', dealId)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .single();

        if (error) throw error;
        return data as Deal;
      }, 'fetch deal');
    },
    enabled: !!user?.id && !!dealId,
    retry: false,
  });
};

export const useDealStats = () => {
  const { user } = useAuth();
  const { retry } = useRetry();

  return useQuery({
    queryKey: ['deal-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return {
        totalDeals: 0,
        inProgress: 0,
        fundedThisMonth: 0,
        conversionRate: 0,
      };

      return retry(async () => {
        // Get all deals (excluding soft deleted)
        const { data: allDeals, error: allDealsError } = await supabase
          .from('deals')
          .select('stage, amount_requested, created_at')
          .eq('user_id', user.id)
          .is('deleted_at', null);

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
      }, 'fetch deal stats');
    },
    enabled: !!user?.id,
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
