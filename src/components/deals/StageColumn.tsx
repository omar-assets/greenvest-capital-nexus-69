
import { Droppable } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DealCard from './DealCard';
import { Loader2, AlertTriangle, TrendingUp, Plus, FileText, Clock } from 'lucide-react';
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

const StageColumn = ({ stage, deals, dragLoading, onCreateDeal }: StageColumnProps) => {
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

  const getPriorityStats = () => {
    const stats = { urgent: 0, high: 0, normal: 0 };
    deals.forEach(deal => {
      const priority = calculatePriorityScore(deal.updated_at, deal.amount_requested, deal.stage);
      stats[priority.level]++;
    });
    return stats;
  };

  const getEmptyStateContent = () => {
    const emptyStates = {
      'New': {
        icon: <Plus className="h-8 w-8 text-blue-400" />,
        title: 'No new deals',
        description: 'Create your first deal to get started',
        showCTA: true,
        ctaText: 'Create Deal'
      },
      'Reviewing Documents': {
        icon: <FileText className="h-8 w-8 text-yellow-400" />,
        title: 'No documents to review',
        description: 'Move deals here when documents are uploaded',
        showCTA: false,
        ctaText: ''
      },
      'Underwriting': {
        icon: <Clock className="h-8 w-8 text-purple-400" />,
        title: 'No deals in underwriting',
        description: 'Deals under review will appear here',
        showCTA: false,
        ctaText: ''
      },
      'Offer Sent': {
        icon: <TrendingUp className="h-8 w-8 text-orange-400" />,
        title: 'No pending offers',
        description: 'Track sent offers and responses here',
        showCTA: false,
        ctaText: ''
      },
      'Funded': {
        icon: <TrendingUp className="h-8 w-8 text-green-400" />,
        title: 'No funded deals yet',
        description: 'Completed deals will appear here',
        showCTA: false,
        ctaText: ''
      },
      'Declined': {
        icon: <AlertTriangle className="h-8 w-8 text-red-400" />,
        title: 'No declined deals',
        description: 'Rejected applications will be shown here',
        showCTA: false,
        ctaText: ''
      }
    };

    return emptyStates[stage.id as keyof typeof emptyStates] || emptyStates['New'];
  };

  // Sort deals by priority score and then by days in stage
  const sortedDeals = sortDealsByPriority(deals);
  const priorityStats = getPriorityStats();
  const emptyState = getEmptyStateContent();

  return (
    <div className="flex flex-col h-full transition-all duration-200 hover:shadow-lg">
      <div className={cn(
        "rounded-t-lg p-4 border-b relative transition-all duration-200",
        stage.color,
        "hover:shadow-md"
      )}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-700 text-sm leading-tight">
            {stage.title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs font-medium transition-all duration-200 hover:scale-105"
            >
              <span className="animate-fade-in">{deals.length}</span>
            </Badge>
            {dragLoading && deals.some(deal => deal.id === dragLoading) && (
              <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
            )}
          </div>
        </div>
        
        {/* Priority indicators in header */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600 font-medium">
            <span className="transition-all duration-300">
              {formatCurrency(getTotalValue())}
            </span>
          </p>
          
          {(priorityStats.urgent > 0 || priorityStats.high > 0) && (
            <div className="flex items-center gap-2 animate-fade-in">
              {priorityStats.urgent > 0 && (
                <div className="flex items-center gap-1 transition-all duration-200 hover:scale-105">
                  <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                  <span className="text-xs text-red-600 font-medium">{priorityStats.urgent}</span>
                </div>
              )}
              {priorityStats.high > 0 && (
                <div className="flex items-center gap-1 transition-all duration-200 hover:scale-105">
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-600 font-medium">{priorityStats.high}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
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
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                isLoading={dragLoading === deal.id}
              />
            ))}
            {provided.placeholder}
            
            {deals.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 animate-fade-in">
                <div className="mb-4 transition-transform duration-300 hover:scale-110">
                  {emptyState.icon}
                </div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">
                  {emptyState.title}
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-48 leading-relaxed">
                  {emptyState.description}
                </p>
                {emptyState.showCTA && onCreateDeal && (
                  <Button
                    onClick={onCreateDeal}
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 focus:scale-105"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {emptyState.ctaText}
                  </Button>
                )}
                <div className="mt-4 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg p-3 w-full transition-colors duration-200 hover:border-slate-300">
                  <p>Drag deals here to move them to this stage</p>
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
