
import { useState, useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

export const useDealFilters = (deals: Deal[]) => {
  const [filter, setFilter] = useState<string>('my');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeals = useMemo(() => {
    let filtered = [...deals];

    // Apply time-based filters
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(deal => new Date(deal.created_at) >= weekAgo);
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(deal => new Date(deal.created_at) >= monthAgo);
    }

    // Apply enhanced search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.company_name.toLowerCase().includes(query) ||
        deal.deal_number.toLowerCase().includes(query) ||
        (deal.contact_name && deal.contact_name.toLowerCase().includes(query)) ||
        (deal.email && deal.email.toLowerCase().includes(query)) ||
        (deal.phone && deal.phone.toLowerCase().includes(query)) ||
        deal.amount_requested.toString().includes(query) ||
        deal.stage.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [deals, filter, searchQuery]);

  return {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredDeals
  };
};
