import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
type Deal = Database['public']['Tables']['deals']['Row'];
interface PriorityStats {
  urgent: number;
  high: number;
  normal: number;
}
interface StageHeaderProps {
  stage: {
    id: string;
    title: string;
    color: string;
  };
  deals: Deal[];
  priorityStats: PriorityStats;
  totalValue: number;
  dragLoading?: string | null;
}
const StageHeader = ({
  stage,
  deals,
  priorityStats,
  totalValue,
  dragLoading
}: StageHeaderProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  return <div className={cn("rounded-t-lg p-4 border-b relative transition-all duration-200", stage.color, "hover:shadow-md")}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-700 text-sm leading-tight">
          {stage.title}
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium transition-all duration-200 hover:scale-105 bg-gray-950">
            <span className="animate-fade-in">{deals.length}</span>
          </Badge>
          {dragLoading && deals.some(deal => deal.id === dragLoading) && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
        </div>
      </div>
      
      {/* Priority indicators in header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600 font-medium">
          <span className="transition-all duration-300">
            {formatCurrency(totalValue)}
          </span>
        </p>
        
        {(priorityStats.urgent > 0 || priorityStats.high > 0) && <div className="flex items-center gap-2 animate-fade-in">
            {priorityStats.urgent > 0 && <div className="flex items-center gap-1 transition-all duration-200 hover:scale-105">
                <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                <span className="text-xs text-red-600 font-medium">{priorityStats.urgent}</span>
              </div>}
            {priorityStats.high > 0 && <div className="flex items-center gap-1 transition-all duration-200 hover:scale-105">
                <TrendingUp className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600 font-medium">{priorityStats.high}</span>
              </div>}
          </div>}
      </div>
    </div>;
};
export default StageHeader;