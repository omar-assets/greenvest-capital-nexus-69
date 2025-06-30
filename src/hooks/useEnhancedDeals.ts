
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

export const useEnhancedDeals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { retry } = useRetry({
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt) => {
      console.log(`Retrying deals query, attempt ${attempt}`);
    }
  });

  // Enhanced fetch function with retry logic
  const fetchDeals = async (): Promise<Deal[]> => {
    if (!user?.id) return [];
    
    return retry(async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    }, 'fetch deals');
  };

  // Fetch all deals with enhanced error handling
  const { data: deals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: fetchDeals,
    enabled: !!user?.id && isOnline,
    retry: false, // We handle retries manually
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Enhanced create deal mutation
  const createDeal = useMutation({
    mutationFn: async (dealData: Omit<DealInsert, 'user_id' | 'id' | 'deal_number' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      return retry(async () => {
        const { data, error } = await supabase
          .from('deals')
          .insert({
            ...dealData,
            user_id: user.id,
            deal_number: '', // Will be set by trigger
          })
          .select()
          .single();

        if (error) throw error;
        return data as Deal;
      }, 'create deal');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Deal Created",
        description: `Deal ${data.deal_number} has been created successfully.`,
      });
    },
    onError: (error) => {
      console.error('Error creating deal:', error);
      toast({
        title: "Error Creating Deal",
        description: "Failed to create deal. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  // Enhanced update deal mutation
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
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals', user?.id], context.previousDeals);
      }
      console.error('Error updating deal:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update deal. Changes have been reverted.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  // Soft delete function
  const softDeleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      return retry(async () => {
        const { data, error } = await supabase.rpc('soft_delete_deal', {
          deal_id: dealId
        });

        if (error) throw error;
        if (!data) throw new Error('Deal not found or already deleted');
        return data;
      }, 'soft delete deal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Deal Deleted",
        description: "Deal has been moved to trash.",
      });
    },
    onError: (error) => {
      console.error('Error deleting deal:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete deal. Please try again.",
        variant: "destructive",
      });
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
    softDeleteDeal: softDeleteDeal.mutate,
    isDeleting: softDeleteDeal.isPending,
    isOnline,
  };
};
