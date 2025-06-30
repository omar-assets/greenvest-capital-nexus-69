
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/offerUtils';

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
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-600">
            <TableHead className="text-slate-300">Rank</TableHead>
            <TableHead className="text-slate-300">ISO Name</TableHead>
            <TableHead className="text-slate-300 text-right">Deals Closed</TableHead>
            <TableHead className="text-slate-300 text-right">Revenue Generated</TableHead>
            <TableHead className="text-slate-300 text-right">Commission Earned</TableHead>
            <TableHead className="text-slate-300 text-right">Conversion Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((iso, index) => (
            <TableRow key={iso.name} className="border-slate-600 hover:bg-slate-700/30">
              <TableCell className="text-slate-200 font-medium">
                <div className="flex items-center gap-2">
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-yellow-500 text-yellow-900' : 
                      index === 1 ? 'bg-gray-400 text-gray-900' : 
                      index === 2 ? 'bg-orange-600 text-orange-100' : 
                      'bg-slate-600 text-slate-200'}
                  `}>
                    {index + 1}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-slate-200 font-medium">{iso.name}</TableCell>
              <TableCell className="text-slate-200 text-right">{iso.deals}</TableCell>
              <TableCell className="text-slate-200 text-right">{formatCurrency(iso.revenue)}</TableCell>
              <TableCell className="text-slate-200 text-right">{formatCurrency(iso.commission)}</TableCell>
              <TableCell className="text-slate-200 text-right">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${iso.conversionRate >= 80 ? 'bg-green-600/20 text-green-400' :
                    iso.conversionRate >= 70 ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-red-600/20 text-red-400'}
                `}>
                  {iso.conversionRate}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
