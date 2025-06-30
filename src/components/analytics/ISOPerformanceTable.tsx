
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/offerUtils';
import { Badge } from '@/components/ui/badge';

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
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                No ISO performance data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
