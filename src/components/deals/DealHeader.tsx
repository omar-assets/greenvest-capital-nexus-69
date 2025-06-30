
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import StageProgressIndicator from './StageProgressIndicator';
import DealActionButtons from './DealActionButtons';

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
        return 'bg-blue-100 text-blue-800';
      case 'Reviewing Documents':
        return 'bg-yellow-100 text-yellow-800';
      case 'Underwriting':
        return 'bg-purple-100 text-purple-800';
      case 'Offer Sent':
        return 'bg-orange-100 text-orange-800';
      case 'Funded':
        return 'bg-green-100 text-green-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4 animate-fade-in">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-foreground">
              {deal.deal_number}
              <StageProgressIndicator currentStage={deal.stage} />
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
          <DealActionButtons />
        </div>
      </div>

      {/* Deal Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Company</h3>
          <p className="text-lg font-semibold text-foreground">{deal.company_name}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Amount Requested</h3>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(deal.amount_requested)}
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Current Stage</h3>
          <Badge className={getStatusColor(deal.stage)} variant="secondary">
            {deal.stage}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default DealHeader;
