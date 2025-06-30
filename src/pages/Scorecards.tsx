
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Eye, ExternalLink, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useScorecard } from '@/hooks/useScorecard';
import { formatDistanceToNow } from 'date-fns';

const Scorecards = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { scorecards, isLoading } = useScorecard();

  const filteredScorecards = scorecards.filter(scorecard => {
    const searchLower = searchQuery.toLowerCase();
    return (
      scorecard.external_app_id?.toString().includes(searchLower) ||
      scorecard.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      error: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-80 bg-slate-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <div className="h-96 bg-slate-50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deal Scorecards</h1>
          <p className="text-muted-foreground mt-1">
            View and manage generated deal scorecards and financial analysis reports.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by app ID or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Scorecards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Scorecards ({filteredScorecards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredScorecards.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {scorecards.length === 0 ? 'No scorecards generated yet' : 'No scorecards match your search'}
              </h3>
              <p className="text-gray-500 mb-4">
                {scorecards.length === 0 
                  ? 'Generate scorecards from the Companies or Deals pages to see them here.'
                  : 'Try adjusting your search criteria.'
                }
              </p>
              {scorecards.length === 0 && (
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/companies')}
                  >
                    Go to Companies
                  </Button>
                  <Button
                    onClick={() => navigate('/deals')}
                  >
                    Go to Deals
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScorecards.map((scorecard) => (
                    <TableRow key={scorecard.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">
                          {scorecard.external_app_id || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(scorecard.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(scorecard.requested_at))} ago
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {scorecard.completed_at 
                            ? formatDistanceToNow(new Date(scorecard.completed_at)) + ' ago'
                            : '-'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {scorecard.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/scorecards/${scorecard.id}`)}
                              title="View Scorecard Details"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                          {scorecard.scorecard_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(scorecard.scorecard_url!, '_blank')}
                              title="Open External Scorecard"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Scorecards;
