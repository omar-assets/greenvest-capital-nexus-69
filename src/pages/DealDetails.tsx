
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-white rounded-lg shadow-sm animate-pulse"></div>
            <div className="h-40 bg-white rounded-lg shadow-sm animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Deal Not Found</h2>
          <p className="text-gray-500 mb-6">The requested deal could not be found.</p>
          <button 
            onClick={() => navigate('/deals')} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Deals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
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

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Tabs defaultValue="activities" className="w-full">
            <div className="border-b border-gray-200 bg-gray-50 px-6">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="activities" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6 py-4 font-medium text-gray-600 data-[state=active]:text-blue-600"
                >
                  Activities
                </TabsTrigger>
                <TabsTrigger 
                  value="documents"
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6 py-4 font-medium text-gray-600 data-[state=active]:text-blue-600"
                >
                  Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="offers"
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6 py-4 font-medium text-gray-600 data-[state=active]:text-blue-600"
                >
                  Offers
                </TabsTrigger>
                <TabsTrigger 
                  value="notes"
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-6 py-4 font-medium text-gray-600 data-[state=active]:text-blue-600"
                >
                  Notes
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="activities" className="mt-0">
                <DealActivities dealId={deal.id} />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-0">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-gray-900 text-lg font-semibold">Deal Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DealDocuments dealId={deal.id} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="offers" className="mt-0">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-gray-900 text-lg font-semibold">Deal Offers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DealOffers dealId={deal.id} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notes" className="mt-0">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-gray-900 text-lg font-semibold">Deal Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DealNotes dealId={deal.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Edit Deal Modal */}
        <EditDealModal
          open={isEditing}
          onOpenChange={setIsEditing}
          deal={deal}
        />
      </div>
    </div>
  );
};

export default DealDetails;
