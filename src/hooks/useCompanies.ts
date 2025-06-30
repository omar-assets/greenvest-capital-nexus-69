
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export const useCompanies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchCompanies = async (): Promise<Company[]> => {
    if (!user?.id) return [];
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('company_name', { ascending: true });

    if (error) throw error;
    return data as Company[];
  };

  const { data: companies = [], isLoading, error, refetch } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: fetchCompanies,
    enabled: !!user?.id,
  });

  const createCompany = useMutation({
    mutationFn: async (companyData: Omit<CompanyInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Company;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Company Created",
        description: `${data.company_name} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating company:', error);
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, ...updateData }: CompanyUpdate & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Company;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Company Updated",
        description: `${data.company_name} has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update company. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating company:', error);
    },
  });

  const findOrCreateCompany = async (companyName: string): Promise<Company> => {
    if (!user?.id) throw new Error('User not authenticated');

    console.log('Finding or creating company:', companyName);

    // First, try to find existing company with exact match
    const { data: existingCompany, error: findError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .ilike('company_name', companyName)
      .single();

    if (existingCompany && !findError) {
      console.log('Found existing company:', existingCompany.id);
      
      // Update any unlinked deals for this company
      const { error: updateError } = await supabase
        .from('deals')
        .update({ 
          company_id: existingCompany.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('company_name', companyName)
        .is('company_id', null);

      if (updateError) {
        console.error('Error linking deals to existing company:', updateError);
      } else {
        console.log('Successfully linked unlinked deals to existing company');
      }

      return existingCompany as Company;
    }

    // If not found, create new company
    console.log('Creating new company for:', companyName);
    const { data: newCompany, error: createError } = await supabase
      .from('companies')
      .insert({
        company_name: companyName,
        user_id: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating company:', createError);
      throw createError;
    }
    
    console.log('Created new company:', newCompany.id);

    // Link any existing deals with this company name
    const { error: linkError } = await supabase
      .from('deals')
      .update({ 
        company_id: newCompany.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('company_name', companyName)
      .is('company_id', null);

    if (linkError) {
      console.error('Error linking deals to new company:', linkError);
    } else {
      console.log('Successfully linked deals to new company');
    }
    
    // Invalidate queries to refresh the cache
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    
    return newCompany as Company;
  };

  return {
    companies,
    isLoading,
    error,
    refetch,
    createCompany: createCompany.mutate,
    isCreating: createCompany.isPending,
    updateCompany: updateCompany.mutate,
    isUpdating: updateCompany.isPending,
    findOrCreateCompany,
  };
};

export const useCompany = (companyId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!user?.id && !!companyId,
  });
};
