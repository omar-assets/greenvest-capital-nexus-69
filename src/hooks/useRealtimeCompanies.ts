
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];

export const useRealtimeCompanies = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for companies...');

    const channel = supabase
      .channel('companies-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'companies',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time: Company inserted', payload.new);
          
          // Add the new company to the cache
          queryClient.setQueryData(['companies', user.id], (oldData: Company[] | undefined) => {
            if (!oldData) return [payload.new as Company];
            return [payload.new as Company, ...oldData];
          });

          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['companies'] });
          queryClient.invalidateQueries({ queryKey: ['deals'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time: Company updated', payload.new);
          
          // Update the company in the cache
          queryClient.setQueryData(['companies', user.id], (oldData: Company[] | undefined) => {
            if (!oldData) return [payload.new as Company];
            return oldData.map(company => 
              company.id === payload.new.id ? payload.new as Company : company
            );
          });

          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['companies'] });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
