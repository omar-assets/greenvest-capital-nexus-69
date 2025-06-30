
import OffersTab from './OffersTab';
import { useDeals } from '@/hooks/useDeals';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface DealOffersProps {
  dealId: string;
}

const DealOffers = ({ dealId }: DealOffersProps) => {
  const { deals, isLoading } = useDeals();
  const deal = deals.find(d => d.id === dealId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Deal not found</p>
      </div>
    );
  }

  return <OffersTab deal={deal} />;
};

export default DealOffers;
