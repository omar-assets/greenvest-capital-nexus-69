
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type Company = DatabaseType['public']['Tables']['companies']['Row'];

interface ApplicationInfoCardProps {
  company: Company;
}

const ApplicationInfoCard = ({ company }: ApplicationInfoCardProps) => {
  const webhookData = company.webhook_metadata as any;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Application Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {company.external_app_id && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Application ID</span>
            <Badge variant="outline" className="font-mono">
              {company.external_app_id}
            </Badge>
          </div>
        )}

        {company.external_app_number && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Application Number</span>
            <Badge variant="secondary" className="font-medium">
              {company.external_app_number}
            </Badge>
          </div>
        )}

        {company.last_synced_at && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Last Synced</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-green-600" />
              <span className="text-sm">
                {formatDate(company.last_synced_at)}
              </span>
            </div>
          </div>
        )}

        {webhookData?.success !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Sync Status</span>
            <Badge variant={webhookData.success ? "default" : "destructive"} className="flex items-center gap-1">
              {webhookData.success ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {webhookData.success ? 'Success' : 'Failed'}
            </Badge>
          </div>
        )}

        {webhookData?.lastUpdated && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Data Updated</span>
            <span className="text-sm text-gray-600">
              {formatDate(webhookData.lastUpdated)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationInfoCard;
