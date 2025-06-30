
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, DollarSign, Mail, Phone, User, Building2 } from 'lucide-react';
import { useDeal } from '@/hooks/useDeals';

const DealDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: deal, isLoading, error } = useDeal(id!);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-800 rounded-lg animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-800 rounded-lg animate-pulse"></div>
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
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-slate-200 mb-2">Deal Not Found</h3>
            <p className="text-slate-400">
              The deal you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/deals"
            className="flex items-center text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Deals
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">{deal.deal_number}</h1>
            <p className="text-slate-400">{deal.company_name}</p>
          </div>
        </div>
        <Badge className={getStatusColor(deal.stage)}>
          {deal.stage}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Information */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Company Name</p>
                      <p className="font-medium text-slate-200">{deal.company_name}</p>
                    </div>
                  </div>

                  {deal.contact_name && (
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Contact Name</p>
                        <p className="font-medium text-slate-200">{deal.contact_name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Requested Amount</p>
                      <p className="font-medium text-slate-200">{formatCurrency(deal.amount_requested)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {deal.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <a
                          href={`mailto:${deal.email}`}
                          className="font-medium text-blue-400 hover:text-blue-300"
                        >
                          {deal.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {deal.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Phone</p>
                        <a
                          href={`tel:${deal.phone}`}
                          className="font-medium text-blue-400 hover:text-blue-300"
                        >
                          {deal.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Created</p>
                      <p className="font-medium text-slate-200">{formatDate(deal.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Update Status
              </Button>
              <Button variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700">
                Edit Deal
              </Button>
              <Button variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700">
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Deal Timeline */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Deal Created</p>
                    <p className="text-xs text-slate-400">{formatDate(deal.created_at)}</p>
                  </div>
                </div>
                {deal.updated_at !== deal.created_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Last Updated</p>
                      <p className="text-xs text-slate-400">{formatDate(deal.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DealDetails;
