
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Filter, 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText, 
  ArrowRight, 
  Upload, 
  Settings,
  Plus
} from 'lucide-react';
import { useDealActivities, ActivityFilter } from '@/hooks/useDealActivities';
import AddActivityModal from './AddActivityModal';
import { formatDistanceToNow } from 'date-fns';

interface ActivityTimelineProps {
  dealId: string;
}

const ActivityTimeline = ({ dealId }: ActivityTimelineProps) => {
  const [filter, setFilter] = useState<ActivityFilter>({ type: 'all' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { activities, isLoading, createActivity, isCreating } = useDealActivities(dealId, filter);

  const getActivityIcon = (category: string) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (category) {
      case 'deal_created': return <FileText {...iconProps} className="h-4 w-4 text-blue-400" />;
      case 'stage_changed': return <ArrowRight {...iconProps} className="h-4 w-4 text-green-400" />;
      case 'document_uploaded': return <Upload {...iconProps} className="h-4 w-4 text-purple-400" />;
      case 'field_updated': return <Settings {...iconProps} className="h-4 w-4 text-orange-400" />;
      case 'note': return <MessageSquare {...iconProps} className="h-4 w-4 text-gray-400" />;
      case 'call': return <Phone {...iconProps} className="h-4 w-4 text-orange-400" />;
      case 'email': return <Mail {...iconProps} className="h-4 w-4 text-blue-400" />;
      default: return <FileText {...iconProps} className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActivityBadgeColor = (activityType: string, category: string) => {
    if (activityType === 'auto') {
      return 'bg-slate-600 text-slate-300';
    }
    
    switch (category) {
      case 'note': return 'bg-gray-600 text-gray-200';
      case 'call': return 'bg-orange-600 text-orange-200';
      case 'email': return 'bg-blue-600 text-blue-200';
      default: return 'bg-slate-600 text-slate-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const fullDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { timeAgo, fullDate };
  };

  const renderMentions = (description: string) => {
    return description.split(/(@\w+)/).map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-200 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Activity Timeline
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-2 pt-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select 
              value={filter.type || 'all'} 
              onValueChange={(value) => setFilter({ ...filter, type: value as any })}
            >
              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all" className="text-slate-200">All</SelectItem>
                <SelectItem value="manual" className="text-slate-200">Manual</SelectItem>
                <SelectItem value="auto" className="text-slate-200">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filter.category || 'all'} 
              onValueChange={(value) => setFilter({ ...filter, category: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="w-36 bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all" className="text-slate-200">All Types</SelectItem>
                <SelectItem value="note" className="text-slate-200">Notes</SelectItem>
                <SelectItem value="call" className="text-slate-200">Calls</SelectItem>
                <SelectItem value="email" className="text-slate-200">Emails</SelectItem>
                <SelectItem value="stage_changed" className="text-slate-200">Stage Changes</SelectItem>
                <SelectItem value="document_uploaded" className="text-slate-200">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No activities found</p>
              <p className="text-sm text-slate-500 mt-1">
                Activities will appear here as you work on the deal
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const { timeAgo, fullDate } = formatTimestamp(activity.created_at);
                const userName = activity.profiles?.full_name || 'Unknown User';
                
                return (
                  <div key={activity.id} className="relative">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-slate-200">
                            {activity.title}
                          </p>
                          <Badge className={`text-xs ${getActivityBadgeColor(activity.activity_type, activity.category)}`}>
                            {activity.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {activity.description && (
                          <p className="text-sm text-slate-300 mb-2">
                            {renderMentions(activity.description)}
                          </p>
                        )}
                        
                        <div className="flex items-center text-xs text-slate-500 space-x-2">
                          <span>{userName}</span>
                          <span>•</span>
                          <span title={fullDate}>{timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connection line */}
                    {index < activities.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-6 bg-slate-600" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddActivityModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={createActivity}
        isLoading={isCreating}
      />
    </>
  );
};

export default ActivityTimeline;
