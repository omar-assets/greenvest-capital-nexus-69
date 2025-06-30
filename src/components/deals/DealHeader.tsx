
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface DealHeaderProps {
  deal: Deal;
}

const DealHeader = ({ deal }: DealHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Reviewing Documents':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Underwriting':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Offer Sent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Funded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-slate-800 border-slate-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-200 mb-2">{deal.deal_number}</h1>
          <h2 className="text-xl text-slate-300">{deal.company_name}</h2>
        </div>
        <div className="text-right">
          <Badge className={getStatusColor(deal.stage)} variant="secondary">
            {deal.stage}
          </Badge>
          <div className="mt-2">
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(deal.amount_requested)}
            </span>
            <p className="text-sm text-slate-400">Requested Amount</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealHeader;
