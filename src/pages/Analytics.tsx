
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICards } from '@/components/analytics/KPICards';
import { PipelineChart } from '@/components/analytics/PipelineChart';
import { FundingTrendsChart } from '@/components/analytics/FundingTrendsChart';
import { ISOPerformanceTable } from '@/components/analytics/ISOPerformanceTable';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Calendar } from 'lucide-react';

const Analytics = () => {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-background min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-muted rounded"></div>
            <div className="h-80 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">Error loading analytics</h3>
          <p className="text-muted-foreground">Failed to load analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your pipeline performance and deal metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>May 31 - Jun 30, 2025</span>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards data={data.kpis} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineChart data={data.pipelineData} />
          </CardContent>
        </Card>

        {/* Funding Trends */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Funding Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <FundingTrendsChart data={data.fundingTrends} />
          </CardContent>
        </Card>
      </div>

      {/* ISO Performance Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">ISO Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ISOPerformanceTable data={data.isoPerformance} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
