
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, X } from 'lucide-react';

interface FilterBarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FilterBar = ({ filter, onFilterChange, searchQuery, onSearchChange }: FilterBarProps) => {
  const filterOptions = [
    { key: 'my', label: 'My Deals' },
    { key: 'all', label: 'All Deals' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">Filter:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange(key)}
                className={filter === key 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-slate-600 text-slate-200 hover:bg-slate-700"
                }
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search deals, companies, contacts..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100 pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterBar;
