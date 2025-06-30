
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  stages
}: FilterBarProps) => {
  const filterOptions = [
    { key: 'my', label: 'My Deals' },
    { key: 'all', label: 'All Deals' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' }
  ];

  const priorityOptions = [
    { key: 'all', label: 'All Priorities' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'high', label: 'High Priority' },
    { key: 'normal', label: 'Normal' }
  ];

  const hasActiveFilters = filter !== 'my' || searchQuery !== '' || stageFilter !== 'all' || priorityFilter !== 'all';

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Main Filter Row */}
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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAllFilters}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Search and Advanced Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search deals, companies, contacts, amounts..."
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

            {/* Stage Filter */}
            <div className="min-w-[160px]">
              <Select value={stageFilter} onValueChange={onStageFilterChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-slate-100">All Stages</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id} className="text-slate-100">
                      {stage.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="min-w-[160px]">
              <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key} className="text-slate-100">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400">Active filters:</span>
              {filter !== 'my' && (
                <Badge variant="secondary" className="text-xs">
                  {filterOptions.find(opt => opt.key === filter)?.label}
                </Badge>
              )}
              {stageFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Stage: {stages.find(stage => stage.id === stageFilter)?.title}
                </Badge>
              )}
              {priorityFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Priority: {priorityOptions.find(opt => opt.key === priorityFilter)?.label}
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterBar;
