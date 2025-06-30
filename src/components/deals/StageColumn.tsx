
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { cn } from '@/lib/utils';
import DealCard from './DealCard';
import StageHeader from './StageHeader';
import EmptyState from './EmptyState';
import ErrorBoundary from '@/components/ErrorBoundary';
import { sortDealsByPriority, calculatePriorityScore } from '@/utils/priorityUtils';
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
  onCreateDeal?: () => void;
}

const DealCardWithErrorBoundary = React.memo(({ deal, index, isLoading }: {
  deal: Deal;
  index: number;
  isLoading: boolean;
}) => (
  <ErrorBoundary
    fallback={
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-3">
        <p className="text-sm text-red-600">Error loading deal card</p>
      </div>
    }
  >
    <DealCard
      deal={deal}
      index={index}
      isLoading={isLoading}
    />
  </ErrorBoundary>
));

DealCardWithErrorBoundary.displayName = 'DealCardWithErrorBoundary';

const StageColumn = ({ stage, deals, dragLoading, onCreateDeal }: StageColumnProps) => {
  const getTotalValue = () => {
    return deals.reduce((sum, deal) => sum + deal.amount_requested, 0);
  };

  const getPriorityStats = () => {
    const stats = { urgent: 0, high: 0, normal: 0 };
    deals.forEach(deal => {
      const priority = calculatePriorityScore(deal.updated_at, deal.amount_requested, deal.stage);
      stats[priority.level]++;
    });
    return stats;
  };

  // Sort deals by priority score and then by days in stage
  const sortedDeals = React.useMemo(() => sortDealsByPriority(deals), [deals]);
  const priorityStats = React.useMemo(() => getPriorityStats(), [deals]);

  return (
    <div className="flex flex-col h-full transition-all duration-200 hover:shadow-lg">
      <ErrorBoundary>
        <StageHeader
          stage={stage}
          deals={deals}
          priorityStats={priorityStats}
          totalValue={getTotalValue()}
          dragLoading={dragLoading}
        />
      </ErrorBoundary>
      
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-3 min-h-[400px] max-h-[600px] overflow-y-auto bg-slate-50 rounded-b-lg border-l border-r border-b transition-all duration-300",
              snapshot.isDraggingOver && "bg-blue-50 border-blue-200 shadow-inner scale-[1.02]",
              "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50"
            )}
            role="region"
            aria-label={`${stage.title} deals`}
          >
            {sortedDeals.map((deal, index) => (
              <DealCardWithErrorBoundary
                key={deal.id}
                deal={deal}
                index={index}
                isLoading={dragLoading === deal.id}
              />
            ))}
            {provided.placeholder}
            
            {deals.length === 0 && (
              <ErrorBoundary>
                <EmptyState
                  stageId={stage.id}
                  onCreateDeal={onCreateDeal}
                />
              </ErrorBoundary>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default React.memo(StageColumn);
