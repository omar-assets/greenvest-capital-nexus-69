
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DealPipelineHeaderProps {
  onCreateDeal: () => void;
  totalDeals: number;
  totalValue: number;
  avgDaysInPipeline: number;
}

const DealPipelineHeader = ({ 
  onCreateDeal, 
  totalDeals, 
  totalValue, 
  avgDaysInPipeline 
}: DealPipelineHeaderProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Deal Pipeline</h1>
          <p className="text-slate-400 mt-1">
            Manage your MCA funding applications through the pipeline.
          </p>
        </div>
        <Button 
          onClick={onCreateDeal}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Deals</p>
                <p className="text-2xl font-bold text-slate-200">{totalDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Pipeline Value</p>
                <p className="text-2xl font-bold text-slate-200">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Avg. Days in Pipeline</p>
                <p className="text-2xl font-bold text-slate-200">{avgDaysInPipeline}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealPipelineHeader;
