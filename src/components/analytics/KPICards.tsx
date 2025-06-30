
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ChartBar, ChartLine, Filter } from 'lucide-react';
import { formatCurrency } from '@/utils/offerUtils';

interface KPIData {
  totalPipelineValue: number;
  dealsFundedThisMonth: number;
  averageDealSize: number;
  conversionRate: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Pipeline Value',
      value: formatCurrency(data.totalPipelineValue),
      icon: DollarSign,
      description: 'Total value of active deals',
      color: 'text-green-600'
    },
    {
      title: 'Deals Funded This Month',
      value: formatCurrency(data.dealsFundedThisMonth),
      icon: ChartBar,
      description: 'Revenue from closed deals',
      color: 'text-blue-600'
    },
    {
      title: 'Average Deal Size',
      value: formatCurrency(data.averageDealSize),
      icon: ChartLine,
      description: 'Mean deal amount',
      color: 'text-purple-600'
    },
    {
      title: 'Conversion Rate',
      value: `${data.conversionRate}%`,
      icon: Filter,
      description: 'Deals closed vs total',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {kpi.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground mb-1">
                {kpi.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
