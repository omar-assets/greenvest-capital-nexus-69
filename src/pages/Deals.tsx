
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import CreateDealModal from '@/components/CreateDealModal';
import { Link } from 'react-router-dom';

const Deals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { deals, isLoading } = useDeals();

  // Filter deals based on search term
  const filteredDeals = deals?.filter(deal =>
    deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.deal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.contact_name && deal.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Application Received':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Funded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-32 bg-slate-700 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-700 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-slate-700 rounded animate-pulse mt-4 sm:mt-0"></div>
        </div>
        <div className="h-64 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Deals</h1>
          <p className="text-slate-400 mt-1">
            Manage your MCA funding applications and track their progress.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search deals by company name, deal number, or stage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            <Button 
              variant="outline" 
              className="sm:w-auto border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">
            All Deals ({filteredDeals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-slate-500 mb-4">
                <Plus className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                {searchTerm ? 'No deals found' : 'No deals yet'}
              </h3>
              <p className="text-slate-400 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by creating your first MCA deal.'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Deal
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-300">Deal Number</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">Company Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">Amount Requested</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">Stage</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">Date Created</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm text-slate-300">{deal.deal_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{deal.company_name}</div>
                        {deal.contact_name && (
                          <div className="text-sm text-slate-400">{deal.contact_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{formatCurrency(deal.amount_requested)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(deal.stage)}>
                          {deal.stage}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-400">{formatDate(deal.created_at)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/deals/${deal.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-slate-600 text-slate-200 hover:bg-slate-700"
                          >
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateDealModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};

export default Deals;
