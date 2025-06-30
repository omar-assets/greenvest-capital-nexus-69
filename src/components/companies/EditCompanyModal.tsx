
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanies } from '@/hooks/useCompanies';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];

const editCompanySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  dba_name: z.string().optional(),
  industry: z.string().optional(),
  years_in_business: z.number().min(0).optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

type EditCompanyForm = z.infer<typeof editCompanySchema>;

interface EditCompanyModalProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditCompanyModal = ({ company, open, onOpenChange }: EditCompanyModalProps) => {
  const { updateCompany, isUpdating } = useCompanies();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditCompanyForm>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: {
      company_name: company.company_name,
      dba_name: company.dba_name || '',
      industry: company.industry || '',
      years_in_business: company.years_in_business || undefined,
      address_line1: company.address_line1 || '',
      address_line2: company.address_line2 || '',
      city: company.city || '',
      state: company.state || '',
      zip_code: company.zip_code || '',
    },
  });

  const onSubmit = async (data: EditCompanyForm) => {
    updateCompany({
      id: company.id,
      company_name: data.company_name,
      dba_name: data.dba_name || null,
      industry: data.industry || null,
      years_in_business: data.years_in_business || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      zip_code: data.zip_code || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Company
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name *
                </Label>
                <Input
                  id="company_name"
                  {...register('company_name')}
                  placeholder="Enter company name"
                />
                {errors.company_name && (
                  <p className="text-sm text-red-400">{errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dba_name">
                  DBA Name
                </Label>
                <Input
                  id="dba_name"
                  {...register('dba_name')}
                  placeholder="Doing business as..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry
                </Label>
                <Input
                  id="industry"
                  {...register('industry')}
                  placeholder="e.g., Restaurant, Retail, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_in_business">
                  Years in Business
                </Label>
                <Input
                  id="years_in_business"
                  type="number"
                  min="0"
                  {...register('years_in_business', { valueAsNumber: true })}
                  placeholder="Enter years"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address_line1">
                  Address Line 1
                </Label>
                <Input
                  id="address_line1"
                  {...register('address_line1')}
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">
                  Address Line 2
                </Label>
                <Input
                  id="address_line2"
                  {...register('address_line2')}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City
                  </Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">
                    State
                  </Label>
                  <Input
                    id="state"
                    {...register('state')}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip_code"
                    {...register('zip_code')}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? 'Updating...' : 'Update Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyModal;
