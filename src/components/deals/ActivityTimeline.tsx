
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
      case 'deal_created': return <FileText {...iconProps} className="h-4 w-4 text-blue-500" />;
      case 'stage_changed': return <ArrowRight {...iconProps} className="h-4 w-4 text-green-500" />;
      case 'document_uploaded': return <Upload {...iconProps} className="h-4 w-4 text-purple-500" />;
      case 'field_updated': return <Settings {...iconProps} className="h-4 w-4 text-orange-500" />;
      case 'note': return <MessageSquare {...iconProps} className="h-4 w-4 text-gray-500" />;
      case 'call': return <Phone {...iconProps} className="h-4 w-4 text-orange-500" />;
      case 'email': return <Mail {...iconProps} className="h-4 w-4 text-blue-500" />;
      default: return <FileText {...iconProps} className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeColor = (activityType: string, category: string) => {
    if (activityType === 'auto') {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }
    
    switch (category) {
      case 'note': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'call': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'email': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'stage_changed': return 'bg-green-50 text-green-700 border-green-200';
      case 'document_uploaded': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
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
          <span key={index} className="text-blue-600 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
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
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center text-lg font-semibold">
              <Calendar className="h-5 w-5 mr-2 text-gray-600" />
              Activity Timeline
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select 
              value={filter.type || 'all'} 
              onValueChange={(value) => setFilter({ ...filter, type: value as any })}
            >
              <SelectTrigger className="w-32 bg-white border-gray-300 text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all" className="text-gray-700 hover:bg-gray-50">All</SelectItem>
                <SelectItem value="manual" className="text-gray-700 hover:bg-gray-50">Manual</SelectItem>
                <SelectItem value="auto" className="text-gray-700 hover:bg-gray-50">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filter.category || 'all'} 
              onValueChange={(value) => setFilter({ ...filter, category: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="w-36 bg-white border-gray-300 text-gray-700">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all" className="text-gray-700 hover:bg-gray-50">All Types</SelectItem>
                <SelectItem value="note" className="text-gray-700 hover:bg-gray-50">Notes</SelectItem>
                <SelectItem value="call" className="text-gray-700 hover:bg-gray-50">Calls</SelectItem>
                <SelectItem value="email" className="text-gray-700 hover:bg-gray-50">Emails</SelectItem>
                <SelectItem value="stage_changed" className="text-gray-700 hover:bg-gray-50">Stage Changes</SelectItem>
                <SelectItem value="document_uploaded" className="text-gray-700 hover:bg-gray-50">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No activities found</p>
              <p className="text-sm text-gray-500 mt-1">
                Activities will appear here as you work on the deal
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity, index) => {
                const { timeAgo, fullDate } = formatTimestamp(activity.created_at || '');
                const userName = activity.profiles?.full_name || 'Unknown User';
                
                return (
                  <div key={activity.id} className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {activity.title}
                          </h4>
                          <Badge className={`text-xs border ${getActivityBadgeColor(activity.activity_type, activity.category)}`}>
                            {activity.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {activity.description && (
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            {renderMentions(activity.description)}
                          </p>
                        )}
                        
                        <div className="flex items-center text-xs text-gray-500 space-x-2">
                          <span className="font-medium">{userName}</span>
                          <span>•</span>
                          <span title={fullDate}>{timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connection line */}
                    {index < activities.length - 1 && (
                      <div className="absolute left-5 top-10 w-0.5 h-8 bg-gray-200" />
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
