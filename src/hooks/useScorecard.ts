import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Scorecard = Database['public']['Tables']['scorecards']['Row'];
type ScorecardSection = Database['public']['Tables']['scorecard_sections']['Row'];

export const useScorecard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getScorecard = useMutation({
    mutationFn: async ({ 
      company_id, 
      deal_id, 
      external_app_id 
    }: { 
      company_id: string; 
      deal_id?: string; 
      external_app_id: number; 
    }) => {
      const { data, error } = await supabase.functions.invoke('get-scorecard', {
        body: { company_id, deal_id, external_app_id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      toast({
        title: "Scorecard Retrieved",
        description: `Scorecard successfully retrieved from ${data.source === 'database' ? 'database' : 'API'}.`,
      });
    },
    onError: (error: any) => {
      console.error('Error processing scorecard:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to process scorecard request",
        variant: "destructive",
      });
    },
  });

  const fetchScorecards = async (): Promise<Scorecard[]> => {
    if (!user?.id) return [];
    
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Scorecard[];
  };

  const fetchScorecardById = async (id: string): Promise<Scorecard | null> => {
    if (!user?.id || !id) return null;
    
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Scorecard;
  };

  const fetchScorecardSections = async (scorecard_id: string): Promise<ScorecardSection[]> => {
    if (!user?.id || !scorecard_id) return [];
    
    const { data, error } = await supabase
      .from('scorecard_sections')
      .select('*')
      .eq('scorecard_id', scorecard_id)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as ScorecardSection[];
  };

  const { data: scorecards = [], isLoading } = useQuery({
    queryKey: ['scorecards', user?.id],
    queryFn: fetchScorecards,
    enabled: !!user?.id,
  });

  return {
    scorecards,
    isLoading,
    getScorecard: getScorecard.mutate,
    isGettingScorecard: getScorecard.isPending,
    fetchScorecardById,
    fetchScorecardSections,
  };
};

export const useScorecardDetails = (id: string) => {
  const { user } = useAuth();
  const { fetchScorecardById, fetchScorecardSections } = useScorecard();

  const { data: scorecard, isLoading: scorecardLoading } = useQuery({
    queryKey: ['scorecard', id],
    queryFn: () => fetchScorecardById(id),
    enabled: !!user?.id && !!id,
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['scorecard-sections', id],
    queryFn: () => fetchScorecardSections(id),
    enabled: !!user?.id && !!id,
  });

  return {
    scorecard,
    sections,
    isLoading: scorecardLoading || sectionsLoading,
  };
};
