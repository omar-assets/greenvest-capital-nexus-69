
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
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Reviewing Documents':
        return 'bg-yellow-100 text-yellow-800';
      case 'Underwriting':
        return 'bg-purple-100 text-purple-800';
      case 'Offer Sent':
        return 'bg-orange-100 text-orange-800';
      case 'Funded':
        return 'bg-green-100 text-green-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statsData = [
    {
      title: 'Total Deals',
      value: stats?.totalDeals?.toString() || '0',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'In Progress',
      value: stats?.inProgress?.toString() || '0',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Funded This Month',
      value: formatCurrency(stats?.fundedThisMonth || 0),
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  // Get pipeline counts by stage
  const pipelineCounts = {
    'New': deals?.filter(deal => deal.stage === 'New').length || 0,
    'Reviewing Documents': deals?.filter(deal => deal.stage === 'Reviewing Documents').length || 0,
    'Underwriting': deals?.filter(deal => deal.stage === 'Underwriting').length || 0,
    'Offer Sent': deals?.filter(deal => deal.stage === 'Offer Sent').length || 0,
    'Funded': deals?.filter(deal => deal.stage === 'Funded').length || 0,
  };

  // Get recent deals (last 5)
  const recentDeals = deals?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.email?.split('@')[0]}! Here's your MCA pipeline overview.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0"
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
            <Card key={stat.title} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recent Deals</CardTitle>
            <Link
              to="/deals"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentDeals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No deals yet. Create your first deal to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    to={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{deal.company_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-muted-foreground">{deal.deal_number}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{formatDate(deal.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(deal.amount_requested)}
                      </span>
                      <Badge className={getStatusColor(deal.stage)} variant="secondary">
                        {deal.stage}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New</span>
                <span className="text-sm font-medium text-foreground">{pipelineCounts['New']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reviewing Documents</span>
                <span className="text-sm font-medium text-foreground">{pipelineCounts['Reviewing Documents']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Underwriting</span>
                <span className="text-sm font-medium text-foreground">{pipelineCounts['Underwriting']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Offer Sent</span>
                <span className="text-sm font-medium text-foreground">{pipelineCounts['Offer Sent']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Funded</span>
                <span className="text-sm font-medium text-foreground">{pipelineCounts['Funded']}</span>
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
