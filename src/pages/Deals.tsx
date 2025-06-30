
import { useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useDeals } from '@/hooks/useDeals';
import { useDealFilters } from '@/hooks/useDealFilters';
import { useDealStats } from '@/hooks/useDealStats';
import CreateDealModal from '@/components/CreateDealModal';
import DealPipelineHeader from '@/components/deals/DealPipelineHeader';
import FilterBar from '@/components/deals/FilterBar';
import StageColumn from '@/components/deals/StageColumn';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

const STAGES = [
  { id: 'New', title: 'New', color: 'bg-blue-50 border-blue-200' },
  { id: 'Reviewing Documents', title: 'Reviewing Documents', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'Underwriting', title: 'Underwriting', color: 'bg-purple-50 border-purple-200' },
  { id: 'Offer Sent', title: 'Offer Sent', color: 'bg-orange-50 border-orange-200' },
  { id: 'Funded', title: 'Funded', color: 'bg-green-50 border-green-200' },
  { id: 'Declined', title: 'Declined', color: 'bg-red-50 border-red-200' },
];

const Deals = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLoading, setDragLoading] = useState<string | null>(null);
  const { deals = [], isLoading } = useDeals();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    priorityFilter,
    setPriorityFilter,
    filteredDeals,
    clearAllFilters
  } = useDealFilters(deals);

  const { totalDeals, totalValue, avgDaysInPipeline } = useDealStats(filteredDeals);

  const updateDealStage = async (dealId: string, newStage: string) => {
    const previousDeals = queryClient.getQueryData(['deals']) as Deal[];
    setDragLoading(dealId);
    
    try {
      // Optimistic update
      queryClient.setQueryData(['deals'], (oldData: Deal[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(deal => 
          deal.id === dealId 
            ? { ...deal, stage: newStage, updated_at: new Date().toISOString() }
            : deal
        );
      });

      console.log('Updating deal stage:', { dealId, newStage });
      
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', dealId);

      if (error) throw error;

      // Invalidate queries to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['deal', dealId] }),
        queryClient.invalidateQueries({ queryKey: ['deal-stats'] })
      ]);

      toast({
        title: "Deal Updated",
        description: `Deal moved to ${newStage}`,
      });
    } catch (error) {
      console.error('Error updating deal stage:', error);
      
      // Rollback optimistic update
      if (previousDeals) {
        queryClient.setQueryData(['deals'], previousDeals);
      }
      
      toast({
        title: "Error",
        description: "Failed to update deal stage. Please try again.",
        variant: "destructive",
      });
      
      // Force refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    } finally {
      setDragLoading(null);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStage = destination.droppableId;
    updateDealStage(draggableId, newStage);
  };

  const getDealsForStage = (stageId: string) => {
    return filteredDeals.filter(deal => deal.stage === stageId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-32 bg-slate-700 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-700 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-slate-700 rounded animate-pulse mt-4 sm:mt-0"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDragging ? 'select-none' : ''}`}>
      <DealPipelineHeader
        onCreateDeal={() => setIsCreateModalOpen(true)}
        totalDeals={totalDeals}
        totalValue={totalValue}
        avgDaysInPipeline={avgDaysInPipeline}
      />

      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onClearAllFilters={clearAllFilters}
        stages={STAGES}
      />

      {/* Kanban Board */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = getDealsForStage(stage.id);
            
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={stageDeals}
                dragLoading={dragLoading}
              />
            );
          })}
        </div>
      </DragDropContext>

      <CreateDealModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};

export default Deals;
