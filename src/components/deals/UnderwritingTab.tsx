
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { 
  Calculator, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { useUnderwritingChecklist, useUnderwritingDecision } from '@/hooks/useUnderwriting';
import { useDealDocuments } from '@/hooks/useDealDocuments';
import { useCompanies } from '@/hooks/useCompanies';
import { 
  calculateRiskAssessment, 
  calculateDebtServiceCoverage, 
  formatCurrency, 
  formatPercentage,
  DECLINE_REASONS 
} from '@/utils/underwritingUtils';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface UnderwritingTabProps {
  deal: Deal;
}

const UnderwritingTab = ({ deal }: UnderwritingTabProps) => {
  const [notes, setNotes] = useState(deal.underwriting_notes || '');
  const [declineReason, setDeclineReason] = useState('');
  
  const { checklist, updateChecklist, isUpdating } = useUnderwritingChecklist(deal.id);
  const { makeDecision, isProcessing } = useUnderwritingDecision(deal.id);
  const { documents } = useDealDocuments(deal.id);
  const { companies } = useCompanies();

  // Find company data for business age
  const company = companies?.find(c => c.id === deal.company_id);
  const yearsInBusiness = company?.years_in_business || undefined;

  // Calculate risk assessment
  const riskAssessment = calculateRiskAssessment(deal, yearsInBusiness);
  const debtServiceCoverage = calculateDebtServiceCoverage(deal);

  // Check document completeness
  const requiredDocuments = ['Bank Statements', 'Tax Returns', 'Application', 'Financial Statements'];
  const presentDocuments = requiredDocuments.filter(category => 
    documents.some(doc => doc.document_category === category)
  );
  const documentsComplete = presentDocuments.length === requiredDocuments.length;

  // Auto-update documents complete status
  const handleChecklistUpdate = (field: string, value: boolean) => {
    updateChecklist({
      [field]: value,
      documents_complete: field === 'documents_complete' ? value : documentsComplete,
    });
  };

  const getRiskBadgeColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'bg-green-600 text-green-200';
      case 'medium': return 'bg-yellow-600 text-yellow-200';
      case 'high': return 'bg-red-600 text-red-200';
    }
  };

  const handleDecision = (status: 'approved' | 'declined' | 'more_info_needed') => {
    makeDecision({
      status,
      declineReason: status === 'declined' ? declineReason : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Monthly Revenue</p>
                <p className="text-lg font-semibold text-slate-200">
                  {formatCurrency(deal.monthly_revenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Credit Score</p>
                <p className="text-lg font-semibold text-slate-200">
                  {deal.credit_score || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">DSC Ratio</p>
                <p className="text-lg font-semibold text-slate-200">
                  {debtServiceCoverage ? `${debtServiceCoverage.toFixed(2)}x` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Years in Business</p>
                <p className="text-lg font-semibold text-slate-200">
                  {yearsInBusiness || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Credit Risk</p>
              <Badge className={getRiskBadgeColor(riskAssessment.creditRisk)}>
                {riskAssessment.creditRisk.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Cash Flow Risk</p>
              <Badge className={getRiskBadgeColor(riskAssessment.cashFlowRisk)}>
                {riskAssessment.cashFlowRisk.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Business Age Risk</p>
              <Badge className={getRiskBadgeColor(riskAssessment.businessAgeRisk)}>
                {riskAssessment.businessAgeRisk.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-2">Daily Balance Risk</p>
              <Badge className={getRiskBadgeColor(riskAssessment.dailyBalanceRisk)}>
                {riskAssessment.dailyBalanceRisk.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Overall Risk Score</span>
              <div className="flex items-center space-x-2">
                <Badge className={getRiskBadgeColor(riskAssessment.overallRisk)}>
                  {riskAssessment.overallRisk.toUpperCase()}
                </Badge>
                <span className="text-slate-200 font-semibold">
                  {riskAssessment.riskScore}/100
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Underwriting Checklist */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Underwriting Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="documents_complete"
                checked={checklist?.documents_complete || documentsComplete}
                onCheckedChange={(checked) => handleChecklistUpdate('documents_complete', !!checked)}
                disabled={isUpdating}
              />
              <label htmlFor="documents_complete" className="text-slate-300">
                All required documents received ({presentDocuments.length}/{requiredDocuments.length})
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="bank_statements_reviewed"
                checked={checklist?.bank_statements_reviewed || false}
                onCheckedChange={(checked) => handleChecklistUpdate('bank_statements_reviewed', !!checked)}
                disabled={isUpdating}
              />
              <label htmlFor="bank_statements_reviewed" className="text-slate-300">
                Bank statements reviewed and analyzed
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="credit_checked"
                checked={checklist?.credit_checked || false}
                onCheckedChange={(checked) => handleChecklistUpdate('credit_checked', !!checked)}
                disabled={isUpdating}
              />
              <label htmlFor="credit_checked" className="text-slate-300">
                Credit report pulled and reviewed
              </label>
            </div>
          </div>

          {/* Document Status */}
          <div className="pt-4 border-t border-slate-600">
            <p className="text-sm text-slate-400 mb-2">Document Status:</p>
            <div className="grid grid-cols-2 gap-2">
              {requiredDocuments.map(docType => {
                const hasDoc = documents.some(doc => doc.document_category === docType);
                return (
                  <div key={docType} className="flex items-center space-x-2">
                    {hasDoc ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm ${hasDoc ? 'text-slate-300' : 'text-slate-500'}`}>
                      {docType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Panel */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Underwriting Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notes */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Underwriter Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your underwriting notes here..."
              className="bg-slate-700 border-slate-600 text-slate-200"
              rows={3}
            />
          </div>

          {/* Decline Reason (shown only when needed) */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Decline Reason (if applicable)</label>
            <Select value={declineReason} onValueChange={setDeclineReason}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue placeholder="Select decline reason..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {DECLINE_REASONS.map(reason => (
                  <SelectItem key={reason} value={reason} className="text-slate-200">
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => handleDecision('approved')}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            
            <Button
              onClick={() => handleDecision('declined')}
              disabled={isProcessing || !declineReason}
              variant="destructive"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
            
            <Button
              onClick={() => handleDecision('more_info_needed')}
              disabled={isProcessing}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Request More Info
            </Button>
          </div>

          {/* Current Status */}
          {deal.underwriting_status && deal.underwriting_status !== 'pending' && (
            <div className="pt-4 border-t border-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Status:</span>
                <Badge className={
                  deal.underwriting_status === 'approved' ? 'bg-green-600 text-green-200' :
                  deal.underwriting_status === 'declined' ? 'bg-red-600 text-red-200' :
                  'bg-yellow-600 text-yellow-200'
                }>
                  {deal.underwriting_status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              {deal.underwriting_date && (
                <p className="text-sm text-slate-500 mt-1">
                  Decided on {new Date(deal.underwriting_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderwritingTab;
