
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Calendar, DollarSign } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import CreateDealModal from '@/components/CreateDealModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Deal = {
  id: string;
  deal_number: string;
  company_name: string;
  contact_name?: string;
  amount_requested: number;
  stage: string;
  created_at: string;
  updated_at: string;
};

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
  const [filter, setFilter] = useState<'my' | 'all' | 'week'>('my');
  const { deals = [], isLoading } = useDeals();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysInStage = (updatedAt: string) => {
    const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getCardPriority = (deal: Deal) => {
    const daysInStage = getDaysInStage(deal.updated_at);
    const amount = deal.amount_requested;
    
    if (daysInStage > 7 || amount > 100000) return 'urgent';
    if (daysInStage > 3 || amount > 50000) return 'high';
    return 'normal';
  };

  const getCardBorderClass = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-l-red-500';
      case 'high': return 'border-l-4 border-l-orange-500';
      default: return 'border-l-4 border-l-gray-300';
    }
  };

  const updateDealStage = async (dealId: string, newStage: string) => {
    try {
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

  const filteredDeals = deals.filter(deal => {
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(deal.created_at) >= weekAgo;
    }
    return true; // 'my' and 'all' show same deals for now since we only show user's deals
  });

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
        <div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Deal Pipeline</h1>
          <p className="text-slate-400 mt-1">
            Manage your MCA funding applications through the pipeline.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">Filter:</span>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'my', label: 'My Deals' },
                { key: 'all', label: 'All Deals' },
                { key: 'week', label: 'This Week' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(key as any)}
                  className={filter === key ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600 text-slate-200 hover:bg-slate-700"}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-h-[600px]">
          {STAGES.map((stage) => {
            const stageDeals = getDealsForStage(stage.id);
            
            return (
              <div key={stage.id} className="flex flex-col">
                <div className={cn("rounded-t-lg p-3 border-b", stage.color)}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-700 text-sm">{stage.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {stageDeals.length}
                    </Badge>
                  </div>
                </div>
                
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-2 space-y-2 min-h-[400px] bg-slate-50 rounded-b-lg border-l border-r border-b",
                        snapshot.isDraggingOver && "bg-slate-100"
                      )}
                    >
                      {stageDeals.map((deal, index) => {
                        const priority = getCardPriority(deal);
                        const daysInStage = getDaysInStage(deal.updated_at);
                        
                        return (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "bg-white shadow-sm hover:shadow-md transition-shadow cursor-grab",
                                  getCardBorderClass(priority),
                                  snapshot.isDragging && "rotate-3 shadow-lg"
                                )}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-slate-800 text-sm truncate">
                                        {deal.company_name}
                                      </h4>
                                      <p className="text-xs text-slate-500 font-mono">
                                        {deal.deal_number}
                                      </p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3 text-slate-400" />
                                      <span className="text-sm font-medium text-slate-700">
                                        {formatCurrency(deal.amount_requested)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-slate-400" />
                                      <span className="text-xs text-slate-500">
                                        {daysInStage} days in stage
                                      </span>
                                    </div>
                                    {deal.contact_name && (
                                      <p className="text-xs text-slate-500 truncate">
                                        {deal.contact_name}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      
                      {stageDeals.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                          No deals in this stage
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
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
