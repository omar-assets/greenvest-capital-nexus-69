
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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Reviewing Documents':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Underwriting':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Offer Sent':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Funded':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Declined':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Row */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Button>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {deal.deal_number}
                </h1>
                <StageProgressIndicator currentStage={deal.stage} />
              </div>
              <p className="text-lg text-gray-600 font-medium">{deal.company_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {actions}
            <Button variant="outline" onClick={onEdit} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Edit className="h-4 w-4 mr-2" />
              Edit Deal
            </Button>
          </div>
        </div>
      </div>

      {/* Deal Info Grid */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Company</h3>
            <p className="text-xl font-semibold text-gray-900">{deal.company_name}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Amount Requested</h3>
            <p className="text-xl font-semibold text-emerald-600">
              {formatCurrency(deal.amount_requested)}
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Current Stage</h3>
            <Badge className={`${getStatusColor(deal.stage)} border font-medium px-3 py-1`} variant="outline">
              {deal.stage}
            </Badge>
          </div>
        </div>
        
        {/* Quick Actions - Integrated into header */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="max-w-md">
            <DealActionButtons />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealHeader;
