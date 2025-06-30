
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Code, Calendar } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];

interface WebhookDataCardProps {
  company: Company;
}

const WebhookDataCard = ({ company }: WebhookDataCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const webhookData = company.webhook_metadata as any;

  if (!webhookData) {
    return null;
  }

  const keyFields = [
    { label: 'Total Applications', value: webhookData.totalApplications },
    { label: 'Returned Count', value: webhookData.returnedCount },
    { label: 'Total Tax Forms', value: webhookData.totalTaxForms },
    { label: 'Total Tax Returns', value: webhookData.totalTaxReturns },
    { label: 'Retrieved At', value: webhookData.retrievedAt },
  ].filter(field => field.value !== undefined && field.value !== null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Application Data
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key metrics always visible */}
        {keyFields.slice(0, 3).map((field, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{field.label}</span>
            <Badge variant="outline">{field.value}</Badge>
          </div>
        ))}

        {/* Expandable section */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            {keyFields.slice(3).map((field, index) => (
              <div key={index + 3} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{field.label}</span>
                <span className="text-sm text-gray-800">
                  {field.label.includes('At') ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(field.value).toLocaleDateString()}
                    </div>
                  ) : (
                    <Badge variant="outline">{field.value}</Badge>
                  )}
                </span>
              </div>
            ))}

            {webhookData.owner && webhookData.owner !== company.company_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Owner Entity</span>
                <span className="text-sm font-medium">{webhookData.owner}</span>
              </div>
            )}

            <details className="group">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                View Raw Data
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(webhookData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebhookDataCard;
