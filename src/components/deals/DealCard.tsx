
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface DealCardProps {
  deal: Deal;
  index: number;
  provided: any;
  snapshot: any;
}

const DealCard = ({ deal, index, provided, snapshot }: DealCardProps) => {
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

  const getCardPriority = () => {
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'high': return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">High</Badge>;
      default: return null;
    }
  };

  const priority = getCardPriority();
  const daysInStage = getDaysInStage(deal.updated_at);

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-grab group",
        getCardBorderClass(priority),
        snapshot.isDragging && "rotate-2 shadow-lg scale-105"
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
          {getPriorityBadge(priority)}
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
              {daysInStage} {daysInStage === 1 ? 'day' : 'days'} in stage
            </span>
          </div>
          {deal.contact_name && (
            <p className="text-xs text-slate-600 truncate font-medium">
              {deal.contact_name}
            </p>
          )}
          
          {/* Contact info visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-1">
            {deal.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500 truncate">{deal.email}</span>
              </div>
            )}
            {deal.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500">{deal.phone}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealCard;
