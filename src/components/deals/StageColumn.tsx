
import { Droppable } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import DealCard from './DealCard';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface StageColumnProps {
  stage: {
    id: string;
    title: string;
    color: string;
  };
  deals: Deal[];
  dragLoading?: string | null;
}

const StageColumn = ({ stage, deals, dragLoading }: StageColumnProps) => {
  const getTotalValue = () => {
    return deals.reduce((sum, deal) => sum + deal.amount_requested, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Sort deals by priority and then by days in stage
  const sortedDeals = [...deals].sort((a, b) => {
    const getDaysInStage = (updatedAt: string) => {
      return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    };

    const getPriorityScore = (deal: Deal) => {
      const daysInStage = getDaysInStage(deal.updated_at);
      const amount = deal.amount_requested;
      
      if (daysInStage > 10 || amount > 150000) return 3; // urgent
      if (daysInStage > 5 || amount > 75000) return 2; // high
      return 1; // normal
    };

    const priorityA = getPriorityScore(a);
    const priorityB = getPriorityScore(b);
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }
    
    // If same priority, sort by days in stage (longer first)
    return getDaysInStage(b.updated_at) - getDaysInStage(a.updated_at);
  });

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      <div className={cn("rounded-t-lg p-3 border-b relative", stage.color)}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-700 text-sm">{stage.title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {deals.length}
            </Badge>
            {dragLoading && deals.some(deal => deal.id === dragLoading) && (
              <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
            )}
          </div>
        </div>
        {deals.length > 0 && (
          <p className="text-xs text-slate-600 font-medium">
            {formatCurrency(getTotalValue())}
          </p>
        )}
      </div>
      
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-2 min-h-[500px] max-h-[600px] overflow-y-auto bg-slate-50 rounded-b-lg border-l border-r border-b transition-colors",
              snapshot.isDraggingOver && "bg-blue-50 border-blue-200"
            )}
          >
            {sortedDeals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                isLoading={dragLoading === deal.id}
              />
            ))}
            {provided.placeholder}
            
            {deals.length === 0 && (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                <div className="text-center">
                  <p>No deals in this stage</p>
                  <p className="text-xs mt-1">Drag deals here</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default StageColumn;
