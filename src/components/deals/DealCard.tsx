
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Mail, Phone, Loader2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePriorityScore, getPriorityStyles } from '@/utils/priorityUtils';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface DealCardProps {
  deal: Deal;
  index: number;
  isLoading?: boolean;
}

const DealCard = ({ deal, index, isLoading }: DealCardProps) => {
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

  const priorityInfo = calculatePriorityScore(deal.updated_at, deal.amount_requested, deal.stage);
  const priorityStyles = getPriorityStyles(priorityInfo.level);
  const daysInStage = getDaysInStage(deal.updated_at);

  const getPriorityIcon = () => {
    switch (priorityInfo.level) {
      case 'urgent':
        return <AlertTriangle className={`h-3 w-3 ${priorityStyles.iconColor}`} />;
      case 'high':
        return <TrendingUp className={`h-3 w-3 ${priorityStyles.iconColor}`} />;
      default:
        return <Clock className={`h-3 w-3 ${priorityStyles.iconColor}`} />;
    }
  };

  const getPriorityBadge = () => {
    if (priorityInfo.level === 'normal') return null;
    
    return (
      <Badge 
        variant="outline" 
        className={cn("text-xs font-medium", priorityStyles.badgeClass, priorityStyles.pulseClass)}
        title={`Priority Score: ${priorityInfo.score}\nReasons: ${priorityInfo.reasons.join(', ')}`}
      >
        <div className="flex items-center gap-1">
          {getPriorityIcon()}
          <span className="capitalize">{priorityInfo.level}</span>
        </div>
      </Badge>
    );
  };

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-grab group mb-2 relative",
            priorityStyles.borderClass,
            priorityStyles.shadowClass,
            snapshot.isDragging && "rotate-2 shadow-lg scale-105 cursor-grabbing",
            isLoading && "opacity-70",
            priorityStyles.pulseClass
          )}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          )}
          
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
              <div className="flex flex-col items-end gap-1">
                {getPriorityBadge()}
                {priorityInfo.level !== 'normal' && (
                  <div className="text-xs text-slate-400 font-medium">
                    Score: {priorityInfo.score}
                  </div>
                )}
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
                  {daysInStage} {daysInStage === 1 ? 'day' : 'days'} in stage
                </span>
              </div>
              
              {/* Priority reasons - visible on hover for non-normal priority */}
              {priorityInfo.level !== 'normal' && priorityInfo.reasons.length > 0 && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-xs text-slate-600 bg-slate-50 rounded p-1 border">
                    <div className="font-medium mb-1">Priority Factors:</div>
                    {priorityInfo.reasons.map((reason, idx) => (
                      <div key={idx} className="text-slate-500">• {reason}</div>
                    ))}
                  </div>
                </div>
              )}
              
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
      )}
    </Draggable>
  );
};

export default DealCard;
