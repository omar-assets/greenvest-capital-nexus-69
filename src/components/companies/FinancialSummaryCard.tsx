
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, FileText, Building2, TrendingUp } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];

interface FinancialSummaryCardProps {
  company: Company;
}

const FinancialSummaryCard = ({ company }: FinancialSummaryCardProps) => {
  const webhookData = company.webhook_metadata as any;
  
  if (!webhookData) {
    return null;
  }

  const totalStatements = webhookData.totalStatements || 0;
  const reconciledStatements = webhookData.reconciledStatements || 0;
  const reconciliationRate = totalStatements > 0 ? (reconciledStatements / totalStatements) * 100 : 0;
  const accountCount = webhookData.accountCount || 0;
  const accountList = webhookData.accountList || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">Statements</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalStatements}</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Accounts</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{accountCount}</div>
          </div>
        </div>

        {totalStatements > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Reconciliation Progress</span>
              <Badge variant={reconciliationRate === 100 ? "default" : "secondary"}>
                {reconciledStatements}/{totalStatements}
              </Badge>
            </div>
            <Progress value={reconciliationRate} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{reconciliationRate.toFixed(0)}% Complete</span>
              {reconciliationRate === 100 && (
                <span className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  Fully Reconciled
                </span>
              )}
            </div>
          </div>
        )}

        {accountList.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Account History</span>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {accountList.slice(0, 6).map((account: string, index: number) => (
                <div key={index} className="text-xs px-2 py-1 bg-gray-50 rounded text-gray-600">
                  {account}
                </div>
              ))}
              {accountList.length > 6 && (
                <div className="text-xs text-gray-500 text-center">
                  +{accountList.length - 6} more accounts
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;
