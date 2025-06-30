
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useDeals } from '@/hooks/useDeals';
import { useContacts } from '@/hooks/useContacts';
import { useToast } from '@/hooks/use-toast';
import EditCompanyModal from '@/components/companies/EditCompanyModal';
import GenerateScorecardButton from '@/components/GenerateScorecardButton';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type Company = DatabaseType['public']['Tables']['companies']['Row'];
type Deal = DatabaseType['public']['Tables']['deals']['Row'];
type Contact = DatabaseType['public']['Tables']['contacts']['Row'];

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const {
    companies,
    isLoading: isCompaniesLoading,
    error: companiesError,
  } = useCompanies();
  const { deals, isLoading: isDealsLoading } = useDeals();
  const { contacts, isLoading: isContactsLoading } = useContacts();

  const company = companies.find((company) => company.id === id);

  useEffect(() => {
    if (companiesError) {
      toast({
        title: "Error fetching companies",
        description: "Failed to load company data. Please try again.",
        variant: "destructive",
      });
    }
  }, [companiesError, toast]);

  if (isCompaniesLoading || isDealsLoading || isContactsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
        <div className="h-96 bg-muted/50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">Company not found</h3>
        <p className="text-muted-foreground mb-4">The requested company could not be found.</p>
        <Button onClick={() => navigate('/companies')}>
          Back to Companies
        </Button>
      </div>
    );
  }

  const companyDeals = deals.filter((deal) => deal.company_id === company.id);
  const companyContacts = contacts.filter((contact) => contact.company_id === company.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/companies')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{company.company_name}</h1>
            {company.dba_name && (
              <p className="text-muted-foreground">DBA: {company.dba_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <GenerateScorecardButton
            company_id={company.id}
            external_app_id={company.external_app_id || undefined}
          />
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Company Name</div>
              <div className="text-foreground">{company.company_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">DBA Name</div>
              <div className="text-foreground">{company.dba_name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Industry</div>
              <div className="text-foreground">{company.industry || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Years in Business</div>
              <div className="text-foreground">{company.years_in_business || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Address</div>
              <div className="text-foreground">
                {company.address_line1}, {company.city}, {company.state}, {company.zip_code}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">External App ID</div>
              <div className="text-foreground">{company.external_app_id || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">External App Number</div>
              <div className="text-foreground">{company.external_app_number || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {companyDeals.length > 0 ? (
            <ul>
              {companyDeals.map((deal) => (
                <li key={deal.id} className="py-2">
                  <Button variant="link" onClick={() => navigate(`/deals/${deal.id}`)}>
                    {deal.deal_number} - {deal.company_name}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No deals associated with this company.</p>
          )}
        </CardContent>
      </Card>

      {/* Contacts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {companyContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyContacts.map((contact) => (
                <div key={contact.id} className="border rounded-md p-4">
                  <div className="font-medium text-foreground">{contact.contact_name}</div>
                  <div className="text-sm text-muted-foreground">{contact.title}</div>
                  <div className="text-sm text-muted-foreground">{contact.email}</div>
                  <div className="text-sm text-muted-foreground">{contact.phone}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No contacts associated with this company.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Modal */}
      <EditCompanyModal
        open={isEditing}
        onOpenChange={setIsEditing}
        company={company}
      />
    </div>
  );
};

export default CompanyDetails;
