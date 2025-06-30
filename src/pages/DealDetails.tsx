import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeal } from '@/hooks/useDeals';
import { useDealDocuments } from '@/hooks/useDealDocuments';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import DealHeader from '@/components/deals/DealHeader';
import StageProgressIndicator from '@/components/deals/StageProgressIndicator';
import DealOverviewTab from '@/components/deals/DealOverviewTab';
import ActivityTimeline from '@/components/deals/ActivityTimeline';
import DealActionButtons from '@/components/deals/DealActionButtons';
import DocumentDropzone, { DocumentDropzoneRef } from '@/components/deals/DocumentDropzone';
import DocumentGrid from '@/components/deals/DocumentGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import UnderwritingTab from '@/components/deals/UnderwritingTab';
import OffersTab from '@/components/deals/OffersTab';

const DealDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const dropzoneRef = useRef<DocumentDropzoneRef>(null);
  const { activeTab, setActiveTab, switchToTab } = useTabNavigation('overview');
  
  const { data: deal, isLoading, error } = useDeal(id!);
  const { 
    documents, 
    isLoading: documentsLoading, 
    uploadDocument, 
    isUploading,
    deleteDocument,
    isDeleting,
    getDownloadUrl 
  } = useDealDocuments(id!);

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

  const handleViewDocument = async (document: any) => {
    try {
      const url = await getDownloadUrl(document.file_path);
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (document: any) => {
    try {
      const url = await getDownloadUrl(document.file_path);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleProcessOCR = (documentId: string) => {
    toast({
      title: "OCR Processing",
      description: "OCR processing will be implemented in the next phase.",
    });
  };

  const handleUploadDocument = () => {
    switchToTab('documents');
    // Small delay to ensure tab is switched before triggering file select
    setTimeout(() => {
      dropzoneRef.current?.triggerFileSelect();
    }, 100);
  };

  const handleAddNote = () => {
    toast({
      title: "Add Note",
      description: "Note functionality will be implemented in the next phase.",
    });
  };

  const handleChangeStage = () => {
    toast({
      title: "Change Stage",
      description: "Stage change functionality will be implemented in the next phase.",
    });
  };

  const handleGenerateOffer = () => {
    switchToTab('offers');
  };

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-slate-700">
                  Documents ({documents.length})
                </TabsTrigger>
                <TabsTrigger value="underwriting" className="data-[state=active]:bg-slate-700">
                  Underwriting
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
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <DocumentDropzone 
                      ref={dropzoneRef}
                      onUpload={uploadDocument}
                      isUploading={isUploading}
                    />
                    
                    {documentsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-48 bg-slate-700 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <DocumentGrid
                        documents={documents}
                        onView={handleViewDocument}
                        onDownload={handleDownloadDocument}
                        onDelete={deleteDocument}
                        onProcessOCR={handleProcessOCR}
                        isDeleting={isDeleting}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="underwriting">
                <UnderwritingTab deal={deal} />
              </TabsContent>

              <TabsContent value="activities">
                <ActivityTimeline dealId={id!} />
              </TabsContent>

              <TabsContent value="offers">
                <OffersTab deal={deal} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DealActionButtons 
              onUploadDocument={handleUploadDocument}
              onAddNote={handleAddNote}
              onChangeStage={handleChangeStage}
              onGenerateOffer={handleGenerateOffer}
            />
            <ActivityTimeline dealId={id!} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DealDetails;
