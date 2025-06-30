
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

interface EditDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
}

const EditDealModal = ({ open, onOpenChange, deal }: EditDealModalProps) => {
  const [formData, setFormData] = useState({
    deal_number: deal.deal_number || '',
    company_name: deal.company_name || '',
    amount_requested: deal.amount_requested || 0,
    stage: deal.stage || 'New'
  });

  useEffect(() => {
    setFormData({
      deal_number: deal.deal_number || '',
      company_name: deal.company_name || '',
      amount_requested: deal.amount_requested || 0,
      stage: deal.stage || 'New'
    });
  }, [deal]);

  const handleSave = () => {
    // TODO: Implement deal update logic
    console.log('Saving deal:', formData);
    onOpenChange(false);
  };

  const stages = ['New', 'Reviewing Documents', 'Underwriting', 'Offer Sent', 'Funded', 'Declined'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deal_number" className="text-right">
              Deal Number
            </Label>
            <Input
              id="deal_number"
              value={formData.deal_number}
              onChange={(e) => setFormData({ ...formData, deal_number: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company_name" className="text-right">
              Company
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount_requested" className="text-right">
              Amount
            </Label>
            <Input
              id="amount_requested"
              type="number"
              value={formData.amount_requested}
              onChange={(e) => setFormData({ ...formData, amount_requested: Number(e.target.value) })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stage" className="text-right">
              Stage
            </Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => setFormData({ ...formData, stage: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDealModal;
