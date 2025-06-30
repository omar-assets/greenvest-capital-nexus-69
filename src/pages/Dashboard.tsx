
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Clock, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDeals, useDealStats } from '@/hooks/useDeals';
import CreateDealModal from '@/components/CreateDealModal';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user } = useAuth();
  const { deals } = useDeals();
  const { data: stats } = useDealStats();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      month: 'short',
      day: 'numeric'
    });
  };

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

  const statsData = [
    {
      title: 'Total Deals',
      value: stats?.totalDeals?.toString() || '0',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'In Progress',
      value: stats?.inProgress?.toString() || '0',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900'
    },
    {
      title: 'Funded This Month',
      value: formatCurrency(stats?.fundedThisMonth || 0),
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    }
  ];

  // Get pipeline counts by stage
  const pipelineCounts = {
    'Application Received': deals?.filter(deal => deal.stage === 'Application Received').length || 0,
    'Under Review': deals?.filter(deal => deal.stage === 'Under Review').length || 0,
    'Approved': deals?.filter(deal => deal.stage === 'Approved').length || 0,
    'Funded': deals?.filter(deal => deal.stage === 'Funded').length || 0,
  };

  // Get recent deals (last 5)
  const recentDeals = deals?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {user?.email?.split('@')[0]}! Here's your MCA pipeline overview.
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-200">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-200">Recent Deals</CardTitle>
            <Link
              to="/deals"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentDeals.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                <p>No deals yet. Create your first deal to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    to={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-200">{deal.company_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-slate-400">{deal.deal_number}</span>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-400">{formatDate(deal.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-slate-300">
                        {formatCurrency(deal.amount_requested)}
                      </span>
                      <Badge className={getStatusColor(deal.stage)} size="sm">
                        {deal.stage}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Application Received</span>
                <span className="text-sm font-medium text-slate-200">{pipelineCounts['Application Received']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Under Review</span>
                <span className="text-sm font-medium text-slate-200">{pipelineCounts['Under Review']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Approved</span>
                <span className="text-sm font-medium text-slate-200">{pipelineCounts['Approved']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Funded</span>
                <span className="text-sm font-medium text-slate-200">{pipelineCounts['Funded']}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateDealModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};

export default Dashboard;
