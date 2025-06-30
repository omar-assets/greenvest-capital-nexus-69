
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICards } from '@/components/analytics/KPICards';
import { PipelineChart } from '@/components/analytics/PipelineChart';
import { FundingTrendsChart } from '@/components/analytics/FundingTrendsChart';
import { ISOPerformanceTable } from '@/components/analytics/ISOPerformanceTable';
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { Calendar, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useQueryClient } from '@tanstack/react-query';

const Analytics = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  
  // Create default date range for the last 30 days
  const dateRange = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date() // today
  };

  const { 
    kpiData, 
    pipelineData, 
    fundingTrendsData, 
    isoPerformanceData, 
    isLoading, 
    hasDealsData,
    hasOffersData,
    hasIsosData,
    errors 
  } = useBasicAnalytics(dateRange);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics-deals'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-offers'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-isos'] });
  };

  // Show loading state only if we have no data at all
  if (isLoading && !hasDealsData && !hasOffersData && !hasIsosData) {
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

  // Show error state if we have critical errors
  const hasCriticalError = errors.deals && !hasDealsData;

  if (hasCriticalError) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="max-w-2xl mx-auto mt-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              Error loading analytics data
              {!isOnline && <WifiOff className="h-4 w-4" />}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>We're having trouble loading your analytics data. This could be due to:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Network connectivity issues</li>
                  <li>Database connection problems</li>
                  <li>Temporary service interruption</li>
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <Button 
                    onClick={handleRetry}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  {!isOnline && (
                    <span className="text-sm text-muted-foreground">
                      Check your internet connection
                    </span>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
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
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>May 31 - Jun 30, 2025</span>
          </div>
          {!isOnline && (
            <div className="flex items-center gap-1 text-red-500 text-sm">
              <WifiOff className="h-4 w-4" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Show warning if we have partial data */}
      {(errors.offers || errors.isos) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Partial Data Available</AlertTitle>
          <AlertDescription>
            Some data sections may be incomplete due to loading issues. 
            {errors.offers && " Offers data unavailable."}
            {errors.isos && " ISO data unavailable."}
            <Button 
              onClick={handleRetry}
              size="sm"
              variant="ghost"
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards - Show if we have deals data */}
      {hasDealsData && <KPICards data={kpiData} />}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview - Show if we have deals data */}
        {hasDealsData && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Pipeline Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineChart data={pipelineData} />
            </CardContent>
          </Card>
        )}

        {/* Funding Trends - Show if we have deals data */}
        {hasDealsData && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Funding Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <FundingTrendsChart data={fundingTrendsData} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ISO Performance Table - Show if we have ISO data */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground">ISO Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {hasIsosData ? (
            <ISOPerformanceTable data={isoPerformanceData} />
          ) : errors.isos ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ISO Data Unavailable</AlertTitle>
              <AlertDescription>
                Unable to load ISO performance data. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading ISO performance data...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
