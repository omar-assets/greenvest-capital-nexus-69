
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getEmptyStateConfig } from './emptyStates';

interface EmptyStateProps {
  stageId: string;
  onCreateDeal?: () => void;
}

const EmptyState = ({ stageId, onCreateDeal }: EmptyStateProps) => {
  const emptyState = getEmptyStateConfig(stageId);

  return (
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
  );
};

export default EmptyState;
