import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import type { Database } from '@/integrations/supabase/types';
import { Button, ArrowLeft, Edit } from '@/components/ui/button';
import { StageProgressIndicator } from '@/components/ui/stage-progress-indicator';
import { DealActionButtons } from '@/components/ui/deal-action-buttons';

type Deal = Database['public']['Tables']['deals']['Row'];

interface DealHeaderProps {
  deal: Deal;
  onBack: () => void;
  onEdit: () => void;
  actions?: React.ReactNode;
}

const DealHeader = ({ deal, onBack, onEdit, actions }: DealHeaderProps) => {
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
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {deal.deal_number}
              <StageProgressIndicator stage={deal.stage} />
            </h1>
            <p className="text-muted-foreground">{deal.company_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Deal
          </Button>
          <DealActionButtons deal={deal} />
        </div>
      </div>

      {/* Deal Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-300">Deal Number</h2>
          <p className="text-sm text-slate-400">{deal.deal_number}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-300">Company Name</h2>
          <p className="text-sm text-slate-400">{deal.company_name}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-300">Amount Requested</h2>
          <p className="text-sm text-slate-400">
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(deal.amount_requested)}
            </span>
            <p className="text-sm text-slate-400">Requested Amount</p>
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-300">Stage</h2>
          <Badge className={getStatusColor(deal.stage)} variant="secondary">
            {deal.stage}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default DealHeader;
