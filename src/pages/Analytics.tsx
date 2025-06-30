
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarDays, AlertCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAnalytics } from '@/hooks/useAnalytics';
import { KPICards } from '@/components/analytics/KPICards';
import { PipelineChart } from '@/components/analytics/PipelineChart';
import { ISOPerformanceTable } from '@/components/analytics/ISOPerformanceTable';
import { FundingTrendsChart } from '@/components/analytics/FundingTrendsChart';

export default function Analytics() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const { 
    kpiData, 
    pipelineData, 
    isoPerformanceData, 
    fundingTrendsData,
    isLoading,
    error 
  } = useAnalytics(dateRange);

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setDateRange({ from: range.from, to: range.to });
      setIsDatePickerOpen(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">Failed to Load Analytics</h3>
            <p className="text-slate-400">There was an error loading the analytics data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-700 rounded animate-pulse"></div>
            <div className="h-4 w-80 bg-slate-700 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-48 bg-slate-700 rounded animate-pulse mt-4 sm:mt-0"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-96 bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Track your pipeline performance and deal metrics
          </p>
        </div>
        
        {/* Date Range Picker */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="mt-4 sm:mt-0 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="end">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
              className="bg-slate-800"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <KPICards data={kpiData} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Pipeline Overview</CardTitle>
            <CardDescription className="text-slate-400">
              Deal count and value by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineChart data={pipelineData} />
          </CardContent>
        </Card>

        {/* Funding Trends Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Funding Trends</CardTitle>
            <CardDescription className="text-slate-400">
              Last 30 days funding activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FundingTrendsChart data={fundingTrendsData} />
          </CardContent>
        </Card>
      </div>

      {/* ISO Performance Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">ISO Performance Leaderboard</CardTitle>
          <CardDescription className="text-slate-400">
            Top performing ISOs by deals closed and revenue generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ISOPerformanceTable data={isoPerformanceData} />
        </CardContent>
      </Card>
    </div>
  );
}
