
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Building2, Phone, Mail, MapPin, Calendar, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompany } from '@/hooks/useCompanies';
import { useDeals } from '@/hooks/useDeals';
import { formatCurrency, formatDate } from '@/utils/formatters';
import EditCompanyModal from '@/components/companies/EditCompanyModal';
import ApplicationInfoCard from '@/components/companies/ApplicationInfoCard';
import FinancialSummaryCard from '@/components/companies/FinancialSummaryCard';
import WebhookDataCard from '@/components/companies/WebhookDataCard';
import { useState } from 'react';

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: company, isLoading: companyLoading } = useCompany(id || '');
  const { deals } = useDeals();

  if (!id) {
    navigate('/companies');
    return null;
  }

  if (companyLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-96 bg-slate-50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/companies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Company not found</h3>
            <p className="text-gray-500">The company you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get deals for this company
  const companyDeals = deals.filter(deal => 
    deal.company_id === company.id || 
    (deal.company_id === null && deal.company_name === company.company_name)
  );

  const formatAddress = () => {
    const parts = [
      company.address_line1,
      company.address_line2,
      company.city,
      company.state,
      company.zip_code
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  const handleCreateNewDeal = () => {
    navigate('/deals', {
      state: {
        createDealWithCompany: company.company_name
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/companies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{company.company_name}</h1>
              {company.external_app_number && (
                <Badge variant="secondary" className="font-mono">
                  {company.external_app_number}
                </Badge>
              )}
            </div>
            {company.dba_name && (
              <p className="text-muted-foreground">DBA: {company.dba_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
          <Button onClick={handleCreateNewDeal} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Company Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <Badge variant="outline">{company.industry}</Badge>
                  </div>
                </div>
              )}

              {company.years_in_business && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Years in Business</p>
                    <p className="font-medium">{company.years_in_business} years</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-sm">{formatAddress()}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Created: {formatDate(company.created_at)}</p>
                <p className="text-sm text-gray-500">Updated: {formatDate(company.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Application Information */}
          <ApplicationInfoCard company={company} />

          {/* Financial Summary */}
          <FinancialSummaryCard company={company} />
        </div>

        {/* Right Column - Deals and Webhook Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Webhook Data */}
          <WebhookDataCard company={company} />

          {/* Deals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Deals ({companyDeals.length})</span>
                <Button size="sm" onClick={handleCreateNewDeal}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyDeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No deals found for this company</p>
                  <Button onClick={handleCreateNewDeal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Deal
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.deal_number}</TableCell>
                        <TableCell>{formatCurrency(deal.amount_requested)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{deal.stage}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            {deal.contact_name && <p className="font-medium">{deal.contact_name}</p>}
                            {deal.email && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {deal.email}
                              </p>
                            )}
                            {deal.phone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {deal.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(deal.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/deals/${deal.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <EditCompanyModal 
          company={company}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </div>
  );
};

export default CompanyDetails;
