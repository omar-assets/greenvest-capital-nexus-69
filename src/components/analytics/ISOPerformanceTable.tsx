
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/offerUtils';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface ISOPerformanceData {
  name: string;
  deals: number;
  revenue: number;
  commission: number;
  conversionRate: number;
}

interface ISOPerformanceTableProps {
  data: ISOPerformanceData[];
}

export function ISOPerformanceTable({ data }: ISOPerformanceTableProps) {
  const getConversionRateBadge = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
    return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">No ISO Performance Data</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            ISO performance metrics will appear here once you start tracking ISOs in your deals. 
            You can assign ISOs to deals when creating or editing them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-foreground font-medium">ISO Name</TableHead>
            <TableHead className="text-foreground font-medium text-center">Deals Closed</TableHead>
            <TableHead className="text-foreground font-medium text-right">Revenue Generated</TableHead>
            <TableHead className="text-foreground font-medium text-right">Commission Earned</TableHead>
            <TableHead className="text-foreground font-medium text-center">Conversion Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((iso, index) => (
            <TableRow 
              key={iso.name} 
              className="border-border hover:bg-muted/30 transition-colors"
            >
              <TableCell className="text-card-foreground font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                    {index + 1}
                  </div>
                  {iso.name}
                </div>
              </TableCell>
              <TableCell className="text-card-foreground text-center font-mono">
                {iso.deals}
              </TableCell>
              <TableCell className="text-card-foreground text-right font-mono">
                {formatCurrency(iso.revenue)}
              </TableCell>
              <TableCell className="text-card-foreground text-right font-mono">
                {formatCurrency(iso.commission)}
              </TableCell>
              <TableCell className="text-center">
                <Badge className={getConversionRateBadge(iso.conversionRate)}>
                  {iso.conversionRate}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
