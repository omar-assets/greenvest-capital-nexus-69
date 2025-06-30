
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
      console.log('Starting scorecard request:', { company_id, deal_id, external_app_id });
      
      const { data, error } = await supabase.functions.invoke('get-scorecard', {
        body: { company_id, deal_id, external_app_id }
      });

      if (error) {
        console.error('Scorecard request error:', error);
        throw error;
      }

      console.log('Scorecard request successful:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      
      const sourceMessage = data.source === 'database' 
        ? 'Retrieved from existing records' 
        : `Generated new scorecard${data.sections_created ? ` with ${data.sections_created} sections` : ''}`;
        
      toast({
        title: "Scorecard Retrieved",
        description: sourceMessage,
      });
    },
    onError: (error: any) => {
      console.error('Error processing scorecard:', error);
      
      let errorMessage = "Failed to process scorecard request";
      let description = "Please try again or contact support if the problem persists.";
      
      // Enhanced error handling based on error details
      if (error.message) {
        if (error.message.includes('No scorecard found')) {
          errorMessage = "No Scorecard Available";
          description = "This application doesn't have scorecard data available yet.";
        } else if (error.message.includes('configuration')) {
          errorMessage = "Configuration Error";
          description = "There's a server configuration issue. Please contact support.";
        } else if (error.message.includes('webhook')) {
          errorMessage = "Service Connection Error";
          description = "Unable to connect to scorecard service. Please try again later.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request Timeout";
          description = "The request took too long to process. Please try again.";
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = "Authentication Error";
          description = "Please log in again to access this feature.";
        }
      }
      
      toast({
        title: errorMessage,
        description: description,
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

    if (error) {
      console.error('Error fetching scorecards:', error);
      throw error;
    }
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
      console.error('Error fetching scorecard by ID:', error);
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

    if (error) {
      console.error('Error fetching scorecard sections:', error);
      throw error;
    }
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
