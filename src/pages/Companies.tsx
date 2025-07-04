import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Search, Edit, User, RefreshCw, Download, Clock, Database } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useDeals } from '@/hooks/useDeals';
import { useRealtimeCompanies } from '@/hooks/useRealtimeCompanies';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CreateCompanyModal from '@/components/companies/CreateCompanyModal';
import EditCompanyModal from '@/components/companies/EditCompanyModal';
import type { Database as DatabaseType } from '@/integrations/supabase/types';
import GenerateScorecardButton from '@/components/GenerateScorecardButton';

type Company = DatabaseType['public']['Tables']['companies']['Row'];
type Deal = DatabaseType['public']['Tables']['deals']['Row'];

const Companies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isValidatingWebhook, setIsValidatingWebhook] = useState(false);

  // Use the enhanced hooks
  const { companies, isLoading, findOrCreateCompany, syncApplications, isSyncing } = useCompanies();
  const { deals } = useDeals();

  // Enable real-time subscriptions
  useRealtimeCompanies();

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.dba_name && company.dba_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (company.external_app_number && company.external_app_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Enhanced function to get deals for a company with fallback logic
  const getCompanyDeals = (company: Company): Deal[] => {
    return deals.filter(deal =>
      // First try to match by company_id
      deal.company_id === company.id ||
      // Fallback: match by company name if company_id is null
      (deal.company_id === null && deal.company_name === company.company_name)
    );
  };

  const getCompanyDealsCount = (company: Company) => {
    return getCompanyDeals(company).length;
  };

  // Check if company was recently synced (within last 5 minutes)
  const isRecentlySynced = (company: Company) => {
    if (!company.last_synced_at) return false;
    const syncTime = new Date(company.last_synced_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - syncTime.getTime()) / (1000 * 60);
    return diffMinutes < 5;
  };

  // Get financial summary from webhook metadata
  const getFinancialSummary = (company: Company) => {
    const webhookData = company.webhook_metadata as any;
    if (!webhookData) return null;
    
    const totalStatements = webhookData.totalStatements || 0;
    const reconciledStatements = webhookData.reconciledStatements || 0;
    const accountCount = webhookData.accountCount || 0;
    
    return { totalStatements, reconciledStatements, accountCount };
  };

  // Function to validate webhook configuration for apps (not scorecard)
  const handleValidateWebhook = async () => {
    setIsValidatingWebhook(true);
    try {
      console.log('Starting apps webhook validation...');
      const { data, error } = await supabase.functions.invoke('validate-webhook-auth', {
        body: { type: 'apps' } // Specify that we want to validate the apps webhook
      });
      
      if (error) {
        console.error('Apps webhook validation error:', error);
        toast({
          title: "Validation Error",
          description: error.message || "Failed to validate apps webhook configuration",
          variant: "destructive"
        });
        return;
      }

      console.log('Apps webhook validation response:', data);
      if (data.success) {
        toast({
          title: "Apps Webhook Valid",
          description: `Apps webhook is accessible and authentication is working. Response time: ${data.responseTime}ms`
        });
      } else {
        let description = data.error || "Unknown validation error";
        if (data.status === 'not_found') {
          description = "Apps webhook URL not found. Please check the URL and ensure your n8n apps workflow is active.";
        } else if (data.status === 'auth_failed') {
          description = "Authentication failed. Please check your Basic Auth credentials.";
        } else if (data.status === 'timeout') {
          description = "Apps webhook request timed out. Please check if your n8n instance is running.";
        } else if (data.status === 'config_error') {
          description = `Configuration error: ${data.error}. Please ensure N8N_WEBHOOK_URL is set correctly.`;
        }
        
        toast({
          title: "Apps Webhook Validation Failed",
          description,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during apps webhook validation:', error);
      toast({
        title: "Validation Error",
        description: "An unexpected error occurred during validation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidatingWebhook(false);
    }
  };

  // Function to backfill missing company links
  const handleBackfillCompanies = async () => {
    setIsBackfilling(true);
    try {
      const unlinkedDeals = deals.filter(deal => deal.company_id === null);
      console.log('Found unlinked deals:', unlinkedDeals.length);

      const dealsByCompany = unlinkedDeals.reduce((acc, deal) => {
        if (!acc[deal.company_name]) {
          acc[deal.company_name] = [];
        }
        acc[deal.company_name].push(deal);
        return acc;
      }, {} as Record<string, Deal[]>);

      for (const [companyName, companyDeals] of Object.entries(dealsByCompany)) {
        try {
          await findOrCreateCompany(companyName);
          console.log(`Processed company: ${companyName} with ${companyDeals.length} deals`);
        } catch (error) {
          console.error(`Error processing company ${companyName}:`, error);
        }
      }
      
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${Object.keys(dealsByCompany).length} companies with existing deals.`
      });
    } catch (error) {
      console.error('Error during backfill:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync some companies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBackfilling(false);
    }
  };

  const formatAddress = (company: Company) => {
    const parts = [company.address_line1, company.city, company.state, company.zip_code].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  const handleCreateNewDeal = (companyName: string) => {
    navigate('/deals', {
      state: {
        createDealWithCompany: companyName
      }
    });
  };

  const handleViewCompanyProfile = (companyId: string) => {
    navigate(`/companies/${companyId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-80 bg-slate-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse mt-4 sm:mt-0"></div>
        </div>
        <div className="h-96 bg-slate-50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client companies and their information.
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={handleValidateWebhook}
            disabled={isValidatingWebhook}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isValidatingWebhook ? 'animate-spin' : ''}`} />
            {isValidatingWebhook ? 'Validating...' : 'Test Apps Webhook'}
          </Button>
          <Button
            variant="outline"
            onClick={() => syncApplications()}
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            <Download className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Applications'}
          </Button>
          <Button
            variant="outline"
            onClick={handleBackfillCompanies}
            disabled={isBackfilling}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isBackfilling ? 'animate-spin' : ''}`} />
            {isBackfilling ? 'Syncing...' : 'Sync Deals'}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search companies by name, DBA, industry, or app number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Directory ({filteredCompanies.length})
            {isSyncing && (
              <Badge variant="outline" className="animate-pulse">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {companies.length === 0 ? 'No companies yet' : 'No companies match your search'}
              </h3>
              <p className="text-gray-500 mb-4">
                {companies.length === 0 
                  ? 'Start by adding your first client company or sync applications from your webhook.'
                  : 'Try adjusting your search criteria or add a new company.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => syncApplications()}
                  disabled={isSyncing}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Sync Applications
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Company
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>App Info</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Financial Summary</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Active Deals</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const financialSummary = getFinancialSummary(company);
                    
                    return (
                      <TableRow key={company.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-slate-900 flex items-center gap-2">
                                {company.company_name}
                                {isRecentlySynced(company) && (
                                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    New
                                  </Badge>
                                )}
                              </div>
                              {company.dba_name && (
                                <div className="text-sm text-gray-500">
                                  DBA: {company.dba_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.external_app_number && (
                              <Badge variant="secondary" className="text-xs font-mono">
                                {company.external_app_number}
                              </Badge>
                            )}
                            {company.external_app_id && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Database className="h-3 w-3" />
                                ID: {company.external_app_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.industry ? (
                            <Badge variant="outline">{company.industry}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {financialSummary ? (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">
                                {financialSummary.totalStatements} statements
                              </div>
                              <div className="text-xs text-gray-600">
                                {financialSummary.accountCount} accounts
                              </div>
                              {financialSummary.reconciledStatements === financialSummary.totalStatements && 
                               financialSummary.totalStatements > 0 && (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                  Reconciled
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {formatAddress(company)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getCompanyDealsCount(company)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {company.external_app_id ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Synced
                              </Badge>
                              {company.last_synced_at && (
                                <span className="text-xs text-gray-500">
                                  {new Date(company.last_synced_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Manual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GenerateScorecardButton
                              company_id={company.id}
                              external_app_id={company.external_app_id || undefined}
                              size="sm"
                              variant="outline"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateNewDeal(company.company_name)}
                              title="Create New Deal"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCompany(company)}
                              title="Edit Company"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCompanyProfile(company.id)}
                              title="View Company Profile"
                            >
                              <User className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCompanyModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
      
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          open={!!editingCompany}
          onOpenChange={(open) => !open && setEditingCompany(null)}
        />
      )}
    </div>
  );
};

export default Companies;
