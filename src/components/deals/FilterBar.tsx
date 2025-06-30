import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface FilterBarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stageFilter: string;
  onStageFilterChange: (stage: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  onClearAllFilters: () => void;
  hasActiveFilters: boolean;
  stages: Array<{ id: string; title: string; color: string }>;
}

const FilterBar = ({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onClearAllFilters,
  hasActiveFilters,
  stages
}: FilterBarProps) => {
  const TIME_FILTERS = [
    { value: 'my', label: 'My Deals', icon: Filter },
    { value: 'all', label: 'All Deals', icon: Filter },
    { value: 'week', label: 'This Week', icon: Filter },
    { value: 'month', label: 'This Month', icon: Filter }
  ];

  const priorityOptions = [
    { key: 'all', label: 'All Priorities' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'high', label: 'High Priority' },
    { key: 'normal', label: 'Normal' }
  ];

  const handleSearchChange = (query: string) => {
    onSearchChange(query);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg border border-slate-700 transition-all duration-200 hover:border-slate-600">
      {/* Search and Clear All */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search deals, companies, contacts..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Search deals"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {hasActiveFilters && (
          <Button
            onClick={onClearAllFilters}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 hover:scale-105 focus:scale-105"
            aria-label="Clear all filters"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-3">
        {/* Time Filters */}
        <div className="flex flex-wrap gap-2">
          {TIME_FILTERS.map((timeFilter) => (
            <Button
              key={timeFilter.value}
              onClick={() => onFilterChange(timeFilter.value)}
              variant={filter === timeFilter.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "transition-all duration-200 hover:scale-105 focus:scale-105",
                filter === timeFilter.value
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500"
              )}
              aria-pressed={filter === timeFilter.value}
            >
              <timeFilter.icon className="h-3 w-3 mr-1" />
              {timeFilter.label}
            </Button>
          ))}
        </div>

        {/* Stage Filter */}
        <Select value={stageFilter} onValueChange={onStageFilterChange}>
          <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-slate-200 transition-all duration-200 hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">
              All Stages
            </SelectItem>
            {stages.map((stage) => (
              <SelectItem 
                key={stage.id} 
                value={stage.id} 
                className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
              >
                {stage.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-36 bg-slate-700 border-slate-600 text-slate-200 transition-all duration-200 hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">
              All Priority
            </SelectItem>
            <SelectItem value="urgent" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                Urgent
              </div>
            </SelectItem>
            <SelectItem value="high" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-orange-500" />
                High
              </div>
            </SelectItem>
            <SelectItem value="normal" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-slate-400" />
                Normal
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-slate-400 animate-fade-in">
          <Filter className="h-3 w-3" />
          <span>Filters active</span>
          <div className="flex gap-1">
            {filter !== 'my' && (
              <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                {TIME_FILTERS.find(f => f.value === filter)?.label}
              </Badge>
            )}
            {stageFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                {stages.find(s => s.id === stageFilter)?.title}
              </Badge>
            )}
            {priorityFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                {priorityFilter} priority
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                "{searchQuery}"
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
