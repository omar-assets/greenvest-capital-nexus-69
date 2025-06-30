
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOffers } from '@/hooks/useOffers';
import CreateOfferModal from './CreateOfferModal';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Eye,
  Send,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { formatCurrency, getStatusBadgeColor, getStatusIcon } from '@/utils/offerUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];
type Offer = Database['public']['Tables']['offers']['Row'];

interface OffersTabProps {
  deal: Deal;
}

const OffersTab = ({ deal }: OffersTabProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { 
    offers, 
    isLoading, 
    createOffer, 
    isCreating,
    updateOffer,
    isUpdating,
    deleteOffer,
    isDeleting 
  } = useOffers(deal.id);

  const handleCreateOffer = (offerData: any) => {
    createOffer(offerData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
      }
    });
  };

  const handleStatusChange = (offerId: string, status: string) => {
    const updateData: any = { id: offerId, status };
    
    if (status === 'sent' && !offers.find(o => o.id === offerId)?.sent_at) {
      updateData.sent_at = new Date().toISOString();
    }
    
    updateOffer(updateData);
  };

  const handleViewOffer = (offer: Offer) => {
    if (offer.status === 'sent' && !offer.viewed_at) {
      updateOffer({
        id: offer.id,
        status: 'viewed',
        viewed_at: new Date().toISOString()
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-200 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Offers ({offers.length})
            </CardTitle>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Offer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Offers Yet</h3>
              <p className="text-slate-400 mb-4">
                Create your first offer to start the funding process.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate First Offer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <Card key={offer.id} className="bg-slate-700 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(offer.status)}</span>
                        <div>
                          <h4 className="font-medium text-slate-200">{offer.offer_number}</h4>
                          <p className="text-sm text-slate-400">Version {offer.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusBadgeColor(offer.status)}>
                          {offer.status.toUpperCase()}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-700 border-slate-600">
                            <DropdownMenuItem
                              onClick={() => handleViewOffer(offer)}
                              className="text-slate-200 hover:bg-slate-600"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {offer.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(offer.id, 'sent')}
                                className="text-slate-200 hover:bg-slate-600"
                                disabled={isUpdating}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Offer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-slate-200 hover:bg-slate-600">
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Amount</p>
                        <p className="font-semibold text-slate-200">
                          {formatCurrency(offer.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Factor Rate</p>
                        <p className="font-semibold text-slate-200">
                          {offer.factor_rate}x
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Payback</p>
                        <p className="font-semibold text-green-400">
                          {formatCurrency(offer.total_payback)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">
                          {offer.payment_frequency === 'daily' ? 'Daily' : 'Weekly'} Payment
                        </p>
                        <p className="font-semibold text-blue-400">
                          {formatCurrency(
                            offer.payment_frequency === 'daily' 
                              ? offer.daily_payment 
                              : offer.weekly_payment
                          )}
                        </p>
                      </div>
                    </div>

                    {offer.iso_commission && offer.iso_commission > 0 && (
                      <div className="p-2 bg-purple-900/30 border border-purple-700 rounded">
                        <p className="text-sm text-purple-300">ISO Commission</p>
                        <p className="font-semibold text-purple-200">
                          {formatCurrency(offer.iso_commission)}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {new Date(offer.created_at).toLocaleDateString()}
                      </div>
                      {offer.expires_at && (
                        <div className="text-yellow-400">
                          Expires {new Date(offer.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {offer.notes && (
                      <div className="pt-2 border-t border-slate-600">
                        <p className="text-sm text-slate-400">Notes:</p>
                        <p className="text-sm text-slate-300 mt-1">{offer.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateOfferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOffer}
        deal={deal}
        isCreating={isCreating}
      />
    </>
  );
};

export default OffersTab;
