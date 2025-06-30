
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
    if (rate >= 80) return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
    if (rate >= 70) return 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30';
    return 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-600 bg-slate-800/30 p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">No ISO Performance Data</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            ISO performance metrics will appear here once you start tracking ISOs in your deals. 
            You can assign ISOs to deals when creating or editing them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-600 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-600 hover:bg-slate-800/50">
            <TableHead className="text-slate-300 font-medium">ISO Name</TableHead>
            <TableHead className="text-slate-300 font-medium text-center">Deals Closed</TableHead>
            <TableHead className="text-slate-300 font-medium text-right">Revenue Generated</TableHead>
            <TableHead className="text-slate-300 font-medium text-right">Commission Earned</TableHead>
            <TableHead className="text-slate-300 font-medium text-center">Conversion Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((iso, index) => (
            <TableRow 
              key={iso.name} 
              className="border-slate-600 hover:bg-slate-800/30 transition-colors"
            >
              <TableCell className="text-slate-200 font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                    {index + 1}
                  </div>
                  {iso.name}
                </div>
              </TableCell>
              <TableCell className="text-slate-300 text-center font-mono">
                {iso.deals}
              </TableCell>
              <TableCell className="text-slate-300 text-right font-mono">
                {formatCurrency(iso.revenue)}
              </TableCell>
              <TableCell className="text-slate-300 text-right font-mono">
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
