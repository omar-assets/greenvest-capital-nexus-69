
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, DollarSign } from 'lucide-react';
import { calculatePayments, calculateISOCommission, formatCurrency } from '@/utils/offerUtils';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offerData: any) => void;
  deal: Deal;
  isCreating: boolean;
}

const CreateOfferModal = ({ isOpen, onClose, onSubmit, deal, isCreating }: CreateOfferModalProps) => {
  const [formData, setFormData] = useState({
    amount: deal.amount_requested || 0,
    factor_rate: 1.25,
    buy_rate: 1.15,
    term_months: 12,
    payment_frequency: 'daily' as 'daily' | 'weekly',
    notes: '',
  });

  const calculations = calculatePayments(
    formData.amount,
    formData.factor_rate,
    formData.term_months,
    formData.payment_frequency
  );

  const isoCommission = calculateISOCommission(
    formData.amount,
    formData.buy_rate,
    formData.factor_rate
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const offerData = {
      ...formData,
      daily_payment: calculations.dailyPayment,
      weekly_payment: calculations.weeklyPayment,
      iso_commission: isoCommission,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    onSubmit(offerData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-200 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Generate Offer for {deal.company_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Offer Details */}
            <div className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200 text-lg">Offer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-slate-300">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      className="bg-slate-700 border-slate-600 text-slate-200"
                      step="1000"
                      min="1000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="factor_rate" className="text-slate-300">Factor Rate</Label>
                    <Input
                      id="factor_rate"
                      type="number"
                      value={formData.factor_rate}
                      onChange={(e) => handleInputChange('factor_rate', parseFloat(e.target.value) || 1.25)}
                      className="bg-slate-700 border-slate-600 text-slate-200"
                      step="0.01"
                      min="1.01"
                      max="2.0"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="buy_rate" className="text-slate-300">Buy Rate (Optional)</Label>
                    <Input
                      id="buy_rate"
                      type="number"
                      value={formData.buy_rate}
                      onChange={(e) => handleInputChange('buy_rate', parseFloat(e.target.value) || 0)}
                      className="bg-slate-700 border-slate-600 text-slate-200"
                      step="0.01"
                      min="1.01"
                      max="1.99"
                    />
                  </div>

                  <div>
                    <Label htmlFor="term_months" className="text-slate-300">Term (Months)</Label>
                    <Select
                      value={formData.term_months.toString()}
                      onValueChange={(value) => handleInputChange('term_months', parseInt(value))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {[6, 9, 12, 15, 18, 24].map(months => (
                          <SelectItem key={months} value={months.toString()} className="text-slate-200">
                            {months} months
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment_frequency" className="text-slate-300">Payment Frequency</Label>
                    <Select
                      value={formData.payment_frequency}
                      onValueChange={(value: 'daily' | 'weekly') => handleInputChange('payment_frequency', value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="daily" className="text-slate-200">Daily</SelectItem>
                        <SelectItem value="weekly" className="text-slate-200">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-slate-300">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-200"
                      rows={3}
                      placeholder="Add any additional notes or terms..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calculations */}
            <div className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200 text-lg flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-400">Funding Amount</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {formatCurrency(formData.amount)}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-400">Total Payback</p>
                      <p className="text-lg font-semibold text-green-400">
                        {formatCurrency(calculations.totalPayback)}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-400">Daily Payment</p>
                      <p className="text-lg font-semibold text-blue-400">
                        {formatCurrency(calculations.dailyPayment)}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-400">Weekly Payment</p>
                      <p className="text-lg font-semibold text-blue-400">
                        {formatCurrency(calculations.weeklyPayment)}
                      </p>
                    </div>
                  </div>

                  {isoCommission > 0 && (
                    <div className="p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
                      <p className="text-sm text-purple-300">ISO Commission</p>
                      <p className="text-lg font-semibold text-purple-200">
                        {formatCurrency(isoCommission)}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-600">
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>Factor Rate: {formData.factor_rate}x</p>
                      <p>Term: {formData.term_months} months</p>
                      <p>Frequency: {formData.payment_frequency === 'daily' ? 'Daily' : 'Weekly'}</p>
                      <p>Total Cost: {formatCurrency(calculations.totalPayback - formData.amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOfferModal;
