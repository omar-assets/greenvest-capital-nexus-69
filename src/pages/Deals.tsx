
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
  const { deals = [], isLoading } = useDeals();
  const { toast } = useToast();

  const {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredDeals
  } = useDealFilters(deals);

  const { totalDeals, totalValue, avgDaysInPipeline } = useDealStats(filteredDeals);

  const updateDealStage = async (dealId: string, newStage: string) => {
    try {
      console.log('Updating deal stage:', { dealId, newStage });
      
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: "Deal Updated",
        description: `Deal moved to ${newStage}`,
      });
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast({
        title: "Error",
        description: "Failed to update deal stage",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
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
    <div className="space-y-6">
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
      />

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map((stage) => {
            const stageDeals = getDealsForStage(stage.id);
            
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={stageDeals}
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
