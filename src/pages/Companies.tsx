
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Search, Edit, FileText } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useDeals } from '@/hooks/useDeals';
import CreateCompanyModal from '@/components/companies/CreateCompanyModal';
import EditCompanyModal from '@/components/companies/EditCompanyModal';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];

const Companies = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const { companies, isLoading } = useCompanies();
  const { deals } = useDeals();

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.dba_name && company.dba_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCompanyDealsCount = (companyId: string) => {
    return deals.filter(deal => deal.company_id === companyId).length;
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

  const handleViewAllDeals = (companyId: string) => {
    navigate('/deals', {
      state: {
        filterByCompany: companyId
      }
    });
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
        <Button 
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700" 
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search companies by name, DBA, or industry..."
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
                  ? 'Start by adding your first client company to track their deals and information.'
                  : 'Try adjusting your search criteria or add a new company.'
                }
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Company
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Years in Business</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Active Deals</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {company.company_name}
                        </div>
                        {company.dba_name && (
                          <div className="text-sm text-gray-500">
                            DBA: {company.dba_name}
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
                      {company.years_in_business ? (
                        `${company.years_in_business} years`
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {formatAddress(company)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getCompanyDealsCount(company.id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                          onClick={() => handleViewAllDeals(company.id)}
                          title="View All Deals"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
