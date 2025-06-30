
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditableField from './EditableField';
import { useDeals } from '@/hooks/useDeals';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface DealOverviewTabProps {
  deal: Deal;
}

const DealOverviewTab = ({ deal }: DealOverviewTabProps) => {
  const { updateDeal } = useDeals();

  const handleFieldUpdate = (field: string, value: string | number) => {
    updateDeal({ id: deal.id, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Company Name"
            value={deal.company_name}
            onSave={(value) => handleFieldUpdate('company_name', value)}
          />
          <EditableField
            label="Contact Name"
            value={deal.contact_name || ''}
            onSave={(value) => handleFieldUpdate('contact_name', value)}
          />
          <EditableField
            label="Email"
            value={deal.email || ''}
            onSave={(value) => handleFieldUpdate('email', value)}
            type="email"
            placeholder="contact@company.com"
          />
          <EditableField
            label="Phone"
            value={deal.phone || ''}
            onSave={(value) => handleFieldUpdate('phone', value)}
            type="tel"
            placeholder="(555) 123-4567"
          />
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Deal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Requested Amount"
            value={deal.amount_requested}
            onSave={(value) => handleFieldUpdate('amount_requested', value)}
            type="number"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Deal Number</label>
            <span className="text-slate-200">{deal.deal_number}</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Current Stage</label>
            <span className="text-slate-200">{deal.stage}</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Created</label>
            <span className="text-slate-200">
              {new Date(deal.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DealOverviewTab;
