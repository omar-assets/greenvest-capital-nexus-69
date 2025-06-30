
import { Plus, FileText, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export interface EmptyStateConfig {
  icon: React.ReactElement;
  title: string;
  description: string;
  showCTA: boolean;
  ctaText: string;
}

export const getEmptyStateConfig = (stageId: string): EmptyStateConfig => {
  const emptyStates: Record<string, EmptyStateConfig> = {
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

  return emptyStates[stageId] || emptyStates['New'];
};
