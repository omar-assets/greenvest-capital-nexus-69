
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Contact = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export const useContacts = (companyId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchContacts = async (): Promise<Contact[]> => {
    if (!user?.id) return [];
    
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.order('is_primary', { ascending: false });

    if (error) throw error;
    return data as Contact[];
  };

  const { data: contacts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', user?.id, companyId],
    queryFn: fetchContacts,
    enabled: !!user?.id,
  });

  const createContact = useMutation({
    mutationFn: async (contactData: Omit<ContactInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // If this is being set as primary, unset other primary contacts for this company
      if (contactData.is_primary) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('company_id', contactData.company_id)
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contact Created",
        description: `${data.contact_name} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating contact:', error);
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updateData }: ContactUpdate & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // If this is being set as primary, unset other primary contacts for this company
      if (updateData.is_primary) {
        const contact = contacts.find(c => c.id === id);
        if (contact) {
          await supabase
            .from('contacts')
            .update({ is_primary: false })
            .eq('company_id', contact.company_id)
            .eq('user_id', user.id)
            .neq('id', id);
        }
      }

      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contact Updated",
        description: `${data.contact_name} has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating contact:', error);
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contact Deleted",
        description: "Contact has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting contact:', error);
    },
  });

  return {
    contacts,
    isLoading,
    error,
    refetch,
    createContact: createContact.mutate,
    isCreating: createContact.isPending,
    updateContact: updateContact.mutate,
    isUpdating: updateContact.isPending,
    deleteContact: deleteContact.mutate,
    isDeleting: deleteContact.isPending,
  };
};

export const usePrimaryContact = (companyId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['primary-contact', companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return null;
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data as Contact | null;
    },
    enabled: !!user?.id && !!companyId,
  });
};
