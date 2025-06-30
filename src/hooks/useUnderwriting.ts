
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];
type UnderwritingChecklist = Database['public']['Tables']['deal_underwriting_checklist']['Row'];
type UnderwritingChecklistInsert = Database['public']['Tables']['deal_underwriting_checklist']['Insert'];
type UnderwritingChecklistUpdate = Database['public']['Tables']['deal_underwriting_checklist']['Update'];

export const useUnderwritingChecklist = (dealId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch checklist for a deal
  const { data: checklist, isLoading } = useQuery({
    queryKey: ['underwriting-checklist', dealId],
    queryFn: async () => {
      if (!user?.id || !dealId) return null;
      
      const { data, error } = await supabase
        .from('deal_underwriting_checklist')
        .select('*')
        .eq('deal_id', dealId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data as UnderwritingChecklist | null;
    },
    enabled: !!user?.id && !!dealId,
  });

  // Create or update checklist
  const updateChecklist = useMutation({
    mutationFn: async (updates: Partial<UnderwritingChecklistUpdate>) => {
      if (!user?.id || !dealId) throw new Error('User not authenticated or deal ID missing');

      if (checklist) {
        // Update existing checklist
        const { data, error } = await supabase
          .from('deal_underwriting_checklist')
          .update({
            ...updates,
            updated_by: user.id,
          })
          .eq('id', checklist.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new checklist
        const { data, error } = await supabase
          .from('deal_underwriting_checklist')
          .insert({
            deal_id: dealId,
            user_id: user.id,
            updated_by: user.id,
            ...updates,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['underwriting-checklist', dealId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update checklist. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating checklist:', error);
    },
  });

  return {
    checklist,
    isLoading,
    updateChecklist: updateChecklist.mutate,
    isUpdating: updateChecklist.isPending,
  };
};

export const useUnderwritingDecision = (dealId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const makeDecision = useMutation({
    mutationFn: async ({
      status,
      declineReason,
      notes,
    }: {
      status: 'approved' | 'declined' | 'more_info_needed';
      declineReason?: string;
      notes?: string;
    }) => {
      if (!user?.id || !dealId) throw new Error('User not authenticated or deal ID missing');

      const updateData: any = {
        underwriting_status: status,
        underwriter_id: user.id,
        underwriting_date: new Date().toISOString(),
      };

      if (status === 'declined' && declineReason) {
        updateData.decline_reason = declineReason;
      }

      if (notes) {
        updateData.underwriting_notes = notes;
      }

      // Update stage based on decision
      if (status === 'approved') {
        updateData.stage = 'Approved';
      } else if (status === 'declined') {
        updateData.stage = 'Declined';
      } else if (status === 'more_info_needed') {
        updateData.stage = 'More Info Needed';
      }

      const { data, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Decision Recorded",
        description: `Deal has been ${data.underwriting_status}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record decision. Please try again.",
        variant: "destructive",
      });
      console.error('Error making decision:', error);
    },
  });

  return {
    makeDecision: makeDecision.mutate,
    isProcessing: makeDecision.isPending,
  };
};
