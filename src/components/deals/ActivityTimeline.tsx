
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, DollarSign, FileText } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface ActivityTimelineProps {
  deal: Deal;
}

const ActivityTimeline = ({ deal }: ActivityTimelineProps) => {
  // Mock activity data - in a real app, this would come from the audit log
  const activities = [
    {
      id: 1,
      type: 'created',
      description: 'Deal created',
      timestamp: deal.created_at,
      icon: FileText,
      color: 'text-blue-400'
    },
    {
      id: 2,
      type: 'stage_change',
      description: `Stage changed to ${deal.stage}`,
      timestamp: deal.updated_at,
      icon: User,
      color: 'text-green-400'
    }
  ];

  const getIcon = (IconComponent: any, color: string) => (
    <IconComponent className={`h-4 w-4 ${color}`} />
  );

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                {getIcon(activity.icon, activity.color)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">{activity.description}</p>
                <p className="text-xs text-slate-400">{formatTimestamp(activity.timestamp)}</p>
              </div>
              {index < activities.length - 1 && (
                <div className="absolute left-4 mt-8 w-0.5 h-4 bg-slate-600" style={{ marginLeft: '15px' }} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
