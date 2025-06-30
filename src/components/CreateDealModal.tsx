
import { useState } from 'react';
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
import { useDeals } from '@/hooks/useDeals';
import { useNavigate } from 'react-router-dom';

const createDealSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  amount_requested: z.number().min(1, 'Amount must be greater than 0'),
});

type CreateDealForm = z.infer<typeof createDealSchema>;

interface CreateDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateDealModal = ({ open, onOpenChange }: CreateDealModalProps) => {
  const navigate = useNavigate();
  const { createDeal, isCreating } = useDeals();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDealForm>({
    resolver: zodResolver(createDealSchema),
  });

  const onSubmit = async (data: CreateDealForm) => {
    createDeal({
      company_name: data.company_name,
      contact_name: data.contact_name || null,
      email: data.email || null,
      phone: data.phone || null,
      amount_requested: data.amount_requested,
    }, {
      onSuccess: (newDeal) => {
        onOpenChange(false);
        reset();
        navigate(`/deals/${newDeal.id}`);
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-100">
            Create New Deal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-slate-200">
                Company Name *
              </Label>
              <Input
                id="company_name"
                {...register('company_name')}
                className="bg-slate-800 border-slate-600 text-slate-100"
                placeholder="Enter company name"
              />
              {errors.company_name && (
                <p className="text-sm text-red-400">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-slate-200">
                Contact Name
              </Label>
              <Input
                id="contact_name"
                {...register('contact_name')}
                className="bg-slate-800 border-slate-600 text-slate-100"
                placeholder="Enter contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="bg-slate-800 border-slate-600 text-slate-100"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-200">
                Phone
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                className="bg-slate-800 border-slate-600 text-slate-100"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_requested" className="text-slate-200">
              Requested Amount *
            </Label>
            <Input
              id="amount_requested"
              type="number"
              step="0.01"
              {...register('amount_requested', { valueAsNumber: true })}
              className="bg-slate-800 border-slate-600 text-slate-100"
              placeholder="Enter requested amount"
            />
            {errors.amount_requested && (
              <p className="text-sm text-red-400">{errors.amount_requested.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDealModal;
