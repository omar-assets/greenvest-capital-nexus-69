
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/offerUtils';
import { format } from 'date-fns';

interface FundingTrendsData {
  date: string;
  deals: number;
  amount: number;
}

interface FundingTrendsChartProps {
  data: FundingTrendsData[];
}

const chartConfig = {
  deals: {
    label: "Deals Funded",
    color: "hsl(var(--primary))"
  },
  amount: {
    label: "Amount Funded",
    color: "hsl(221.2 83.2% 53.3%)"
  }
};

export function FundingTrendsChart({ data }: FundingTrendsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-card-foreground font-medium mb-2">
            {format(new Date(label), 'MMM dd, yyyy')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-card-foreground text-sm">
              <span style={{ color: entry.color }}>●</span>
              {` ${entry.name}: ${
                entry.dataKey === 'amount' 
                  ? formatCurrency(entry.value)
                  : entry.value
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="date"
            className="text-muted-foreground"
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          />
          <YAxis yAxisId="left" className="text-muted-foreground" />
          <YAxis yAxisId="right" orientation="right" className="text-muted-foreground" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="deals" 
            name="Deals Funded"
            stroke={chartConfig.deals.color}
            strokeWidth={2}
            dot={{ fill: chartConfig.deals.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="amount" 
            name="Amount Funded"
            stroke={chartConfig.amount.color}
            strokeWidth={2}
            dot={{ fill: chartConfig.amount.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
