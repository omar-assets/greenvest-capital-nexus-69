
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useCompanies } from '@/hooks/useCompanies';
import { useToast } from '@/hooks/use-toast';
import EditDealModal from '@/components/deals/EditDealModal';
import DealActivities from '@/components/deals/DealActivities';
import DealDocuments from '@/components/deals/DealDocuments';
import DealOffers from '@/components/deals/DealOffers';
import DealNotes from '@/components/deals/DealNotes';
import DealHeader from '@/components/deals/DealHeader';
import StageProgressIndicator from '@/components/deals/StageProgressIndicator';
import GenerateScorecardButton from '@/components/GenerateScorecardButton';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type Deal = DatabaseType['public']['Tables']['deals']['Row'];
type Company = DatabaseType['public']['Tables']['companies']['Row'];

const DealDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { deals, isLoading: isDealsLoading } = useDeals();
  const { companies, isLoading: isCompaniesLoading } = useCompanies();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);

  useEffect(() => {
    if (id && deals.length > 0) {
      const foundDeal = deals.find((deal) => deal.id === id);
      setDeal(foundDeal || null);
    }
  }, [id, deals]);

  useEffect(() => {
    if (deal && deal.company_id && companies.length > 0) {
      const foundCompany = companies.find((company) => company.id === deal.company_id);
      setCompanyData(foundCompany || null);
    }
  }, [deal, companies]);

  if (isDealsLoading || isCompaniesLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-slate-100 rounded-lg animate-pulse"></div>
          <div className="h-40 bg-slate-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Deal Not Found</h2>
        <p className="text-gray-500">The requested deal could not be found.</p>
        <button onClick={() => navigate('/deals')} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300">
          Back to Deals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4">
      {/* Header */}
      <DealHeader 
        deal={deal} 
        onBack={() => navigate('/deals')}
        onEdit={() => setIsEditing(true)}
        actions={
          <GenerateScorecardButton
            company_id={deal.company_id || ''}
            deal_id={deal.id}
            external_app_id={companyData?.external_app_id || undefined}
            disabled={!companyData?.external_app_id}
          />
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Deal Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DealActivities dealId={deal.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DealDocuments dealId={deal.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <DealOffers dealId={deal.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <DealNotes dealId={deal.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Deal Modal */}
      <EditDealModal
        open={isEditing}
        onOpenChange={setIsEditing}
        deal={deal}
      />
    </div>
  );
};

export default DealDetails;
