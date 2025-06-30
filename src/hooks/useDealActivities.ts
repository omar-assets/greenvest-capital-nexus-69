
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DealActivity = Database['public']['Tables']['deal_activities']['Row'];
type DealActivityInsert = Database['public']['Tables']['deal_activities']['Insert'];

// Define the extended type for activities with profile info
type ActivityWithProfile = DealActivity & {
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export interface ActivityFilter {
  type?: 'all' | 'auto' | 'manual';
  category?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export const useDealActivities = (dealId: string, filter?: ActivityFilter) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch activities for a deal
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['deal-activities', dealId, filter],
    queryFn: async () => {
      if (!user?.id || !dealId) return [];
      
      let query = supabase
        .from('deal_activities')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter?.type && filter.type !== 'all') {
        query = query.eq('activity_type', filter.type);
      }
      
      if (filter?.category) {
        query = query.eq('category', filter.category);
      }
      
      if (filter?.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.from.toISOString())
          .lte('created_at', filter.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }
      
      // Return the data as-is, let TypeScript handle the type inference
      return (data || []) as ActivityWithProfile[];
    },
    enabled: !!user?.id && !!dealId,
  });

  // Create manual activity
  const createActivity = useMutation({
    mutationFn: async (activityData: {
      category: 'note' | 'call' | 'email';
      title: string;
      description: string;
      mentionedUsers?: string[];
    }) => {
      if (!user?.id || !dealId) throw new Error('User not authenticated or deal ID missing');

      const { data, error } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          user_id: user.id,
          activity_type: 'manual',
          category: activityData.category,
          title: activityData.title,
          description: activityData.description,
          mentioned_users: activityData.mentionedUsers || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as DealActivity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] });
      toast({
        title: "Activity Added",
        description: "Activity has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating activity:', error);
    },
  });

  return {
    activities,
    isLoading,
    refetch,
    createActivity: createActivity.mutate,
    isCreating: createActivity.isPending,
  };
};

// Hook to get activity statistics
export const useActivityStats = (dealId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-stats', dealId],
    queryFn: async () => {
      if (!user?.id || !dealId) return {
        totalActivities: 0,
        manualActivities: 0,
        autoActivities: 0,
        recentActivity: null,
      };

      const { data: activities, error } = await supabase
        .from('deal_activities')
        .select('activity_type, created_at')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalActivities = activities?.length || 0;
      const manualActivities = activities?.filter(a => a.activity_type === 'manual').length || 0;
      const autoActivities = activities?.filter(a => a.activity_type === 'auto').length || 0;
      const recentActivity = activities?.[0]?.created_at || null;

      return {
        totalActivities,
        manualActivities,
        autoActivities,
        recentActivity,
      };
    },
    enabled: !!user?.id && !!dealId,
  });
};
