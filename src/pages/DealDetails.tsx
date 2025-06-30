
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeal } from '@/hooks/useDeals';
import ErrorBoundary from '@/components/ErrorBoundary';
import DealHeader from '@/components/deals/DealHeader';
import StageProgressIndicator from '@/components/deals/StageProgressIndicator';
import DealOverviewTab from '@/components/deals/DealOverviewTab';
import ActivityTimeline from '@/components/deals/ActivityTimeline';
import DealActionButtons from '@/components/deals/DealActionButtons';

const DealDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: deal, isLoading, error } = useDeal(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="h-32 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="h-16 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-800 rounded-lg animate-pulse"></div>
            <div className="h-64 bg-slate-800 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/deals"
            className="flex items-center text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Deals
          </Link>
        </div>
        <div className="bg-slate-800 border-slate-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-slate-200 mb-2">Deal Not Found</h3>
          <p className="text-slate-400">
            The deal you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Link
            to="/deals"
            className="flex items-center text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Deals
          </Link>
        </div>

        {/* Deal Header */}
        <DealHeader deal={deal} />

        {/* Stage Progress Indicator */}
        <StageProgressIndicator currentStage={deal.stage} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-slate-700">
                  Documents
                </TabsTrigger>
                <TabsTrigger value="activities" className="data-[state=active]:bg-slate-700">
                  Activities
                </TabsTrigger>
                <TabsTrigger value="offers" className="data-[state=active]:bg-slate-700">
                  Offers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <DealOverviewTab deal={deal} />
              </TabsContent>

              <TabsContent value="documents">
                <div className="bg-slate-800 border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-slate-200 mb-4">Documents</h3>
                  <p className="text-slate-400">Document management will be implemented in the next phase.</p>
                </div>
              </TabsContent>

              <TabsContent value="activities">
                <div className="bg-slate-800 border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-slate-200 mb-4">Activities</h3>
                  <p className="text-slate-400">Detailed activity log will be implemented in the next phase.</p>
                </div>
              </TabsContent>

              <TabsContent value="offers">
                <div className="bg-slate-800 border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-slate-200 mb-4">Offers</h3>
                  <p className="text-slate-400">Offer management will be implemented in the next phase.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DealActionButtons />
            <ActivityTimeline deal={deal} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DealDetails;
