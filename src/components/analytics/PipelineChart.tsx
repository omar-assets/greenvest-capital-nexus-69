
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/offerUtils';

interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

interface PipelineChartProps {
  data: PipelineData[];
}

const chartConfig = {
  count: {
    label: "Deal Count",
    color: "#3b82f6"
  },
  value: {
    label: "Deal Value",
    color: "#10b981"
  }
};

export function PipelineChart({ data }: PipelineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-200 font-medium mb-2">{`Stage: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-slate-300 text-sm">
              <span style={{ color: entry.color }}>●</span>
              {` ${entry.name}: ${
                entry.dataKey === 'value' 
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
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <XAxis 
            dataKey="stage" 
            className="text-slate-400"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis yAxisId="left" className="text-slate-400" />
          <YAxis yAxisId="right" orientation="right" className="text-slate-400" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="count" 
            name="Deal Count"
            fill={chartConfig.count.color}
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="value" 
            name="Deal Value ($)"
            fill={chartConfig.value.color}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
