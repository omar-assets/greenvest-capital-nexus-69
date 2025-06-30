
import { Droppable } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import DealCard from './DealCard';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface StageColumnProps {
  stage: {
    id: string;
    title: string;
    color: string;
  };
  deals: Deal[];
}

const StageColumn = ({ stage, deals }: StageColumnProps) => {
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

  return (
    <div className="flex flex-col h-full">
      <div className={cn("rounded-t-lg p-3 border-b", stage.color)}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-700 text-sm">{stage.title}</h3>
          <Badge variant="outline" className="text-xs">
            {deals.length}
          </Badge>
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
              "flex-1 p-2 space-y-2 min-h-[500px] bg-slate-50 rounded-b-lg border-l border-r border-b transition-colors",
              snapshot.isDraggingOver && "bg-blue-50 border-blue-200"
            )}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                provided={provided}
                snapshot={snapshot}
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
