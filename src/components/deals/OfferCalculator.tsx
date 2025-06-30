
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditableField from './EditableField';
import { formatCurrency } from '@/utils/formatters';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface OfferCalculatorProps {
  deal: Deal;
  onUpdate: (field: string, value: string | number) => void;
}

const OfferCalculator = ({ deal, onUpdate }: OfferCalculatorProps) => {
  const fundingAmount = deal.amount_requested || 0;
  const factorRate = deal.factor_rate || 1.25;
  const termMonths = deal.term_months || 12;

  // Calculate derived values
  const totalPayback = fundingAmount * factorRate;
  const dailyPayment = totalPayback / (termMonths * 30.44); // Average days per month

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200">Offer Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Funding Amount</label>
            <span className="text-slate-200 text-lg font-medium">
              {formatCurrency(fundingAmount)}
            </span>
            <p className="text-xs text-slate-500">From requested amount</p>
          </div>

          <EditableField
            label="Factor Rate"
            value={factorRate}
            onSave={(value) => onUpdate('factor_rate', value)}
            type="number"
            step={0.01}
            min={1.0}
            placeholder="1.25"
          />

          <EditableField
            label="Term (months)"
            value={termMonths}
            onSave={(value) => onUpdate('term_months', value)}
            type="integer"
            min={1}
            max={60}
            placeholder="12"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Total Payback</label>
            <span className="text-slate-200 text-lg font-medium">
              {formatCurrency(totalPayback)}
            </span>
            <p className="text-xs text-slate-500">Funding × Factor Rate</p>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-center">
              <label className="text-sm font-medium text-slate-300">Daily Payment</label>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {formatCurrency(dailyPayment)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Based on {termMonths} months × 30.44 avg days/month
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferCalculator;
