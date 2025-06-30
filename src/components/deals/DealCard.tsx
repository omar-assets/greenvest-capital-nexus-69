
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're in the middle of a drag operation, don't navigate
    if (dragStartPos) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
      );
      
      // If mouse moved more than 5 pixels, consider it a drag, not a click
      if (distance > 5) {
        setDragStartPos(null);
        return;
      }
    }
    
    setDragStartPos(null);
    navigate(`/deals/${deal.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/deals/${deal.id}`);
    }
  };

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
        className={cn(
          "text-xs font-medium transition-all duration-200 hover:scale-105", 
          priorityStyles.badgeClass, 
          priorityStyles.pulseClass
        )}
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
            "bg-white shadow-sm transition-all duration-300 cursor-pointer group mb-3 relative",
            "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
            "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50",
            priorityStyles.borderClass,
            priorityStyles.shadowClass,
            snapshot.isDragging && "rotate-2 shadow-xl scale-105 cursor-grabbing z-50",
            isLoading && "opacity-70",
            priorityStyles.pulseClass
          )}
          role="button"
          tabIndex={0}
          aria-label={`Deal for ${deal.company_name}, ${formatCurrency(deal.amount_requested)}. Click to view details.`}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10 transition-all duration-300">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Updating...</span>
              </div>
            </div>
          )}
          
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-800 text-sm truncate transition-colors duration-200 group-hover:text-slate-900">
                  {deal.company_name}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-1 transition-colors duration-200 group-hover:text-slate-600">
                  {deal.deal_number}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getPriorityBadge()}
                {priorityInfo.level !== 'normal' && (
                  <div className="text-xs text-slate-400 font-medium transition-colors duration-200 group-hover:text-slate-500">
                    Score: {priorityInfo.score}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-slate-400 transition-colors duration-200 group-hover:text-green-500" />
                <span className="text-sm font-medium text-slate-700 transition-colors duration-200 group-hover:text-slate-900">
                  {formatCurrency(deal.amount_requested)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-slate-400 transition-colors duration-200 group-hover:text-blue-500" />
                <span className="text-xs text-slate-500 transition-colors duration-200 group-hover:text-slate-600">
                  {daysInStage} {daysInStage === 1 ? 'day' : 'days'} in stage
                </span>
              </div>
              
              {/* Priority reasons - visible on hover for non-normal priority */}
              {priorityInfo.level !== 'normal' && priorityInfo.reasons.length > 0 && (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="text-xs text-slate-600 bg-slate-50 rounded-md p-2 border border-slate-200">
                    <div className="font-medium mb-1 text-slate-700">Priority Factors:</div>
                    {priorityInfo.reasons.map((reason, idx) => (
                      <div key={idx} className="text-slate-500 leading-relaxed">• {reason}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {deal.contact_name && (
                <p className="text-xs text-slate-600 truncate font-medium transition-colors duration-200 group-hover:text-slate-700">
                  {deal.contact_name}
                </p>
              )}
              
              {/* Contact info visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 space-y-2">
                {deal.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-slate-400 transition-colors duration-200 group-hover:text-blue-500" />
                    <span className="text-xs text-slate-500 truncate transition-colors duration-200 group-hover:text-slate-600">
                      {deal.email}
                    </span>
                  </div>
                )}
                {deal.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-400 transition-colors duration-200 group-hover:text-green-500" />
                    <span className="text-xs text-slate-500 transition-colors duration-200 group-hover:text-slate-600">
                      {deal.phone}
                    </span>
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
