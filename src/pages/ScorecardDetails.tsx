
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ExternalLink, FileText, TrendingUp, DollarSign, Calendar, Building } from 'lucide-react';
import { useScorecardDetails } from '@/hooks/useScorecard';
import { formatCurrency, formatDate } from '@/utils/formatters';

const ScorecardDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const { scorecard, sections, isLoading } = useScorecardDetails(id!);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-96 bg-slate-50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!scorecard) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Scorecard not found</h3>
        <p className="text-gray-500 mb-4">The requested scorecard could not be found.</p>
        <Button onClick={() => navigate('/scorecards')}>
          Back to Scorecards
        </Button>
      </div>
    );
  }

  // Get unique accounts and months for filtering
  const getFilterOptions = () => {
    const accounts = new Set<string>();
    const months = new Set<string>();

    sections.forEach(section => {
      if (Array.isArray(section.section_data)) {
        section.section_data.forEach((item: any) => {
          if (item.account || item.accountidx) {
            accounts.add(item.account || `Account ${item.accountidx}`);
          }
          if (item.statement_month) {
            months.add(item.statement_month);
          }
        });
      }
    });

    return {
      accounts: Array.from(accounts).sort(),
      months: Array.from(months).sort()
    };
  };

  const { accounts, months } = getFilterOptions();

  const renderSectionContent = (section: any) => {
    const sectionName = section.section_name;
    const data = section.section_data;

    // Filter data based on selected account and month
    let filteredData = data;
    if (Array.isArray(data)) {
      filteredData = data.filter((item: any) => {
        const accountMatch = selectedAccount === 'all' || 
          item.account === selectedAccount || 
          `Account ${item.accountidx}` === selectedAccount;
        
        const monthMatch = selectedMonth === 'all' || 
          item.statement_month === selectedMonth;
        
        return accountMatch && monthMatch;
      });
    }

    switch (sectionName) {
      case 'revenue_statistics':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((stat: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium">{stat.label}</h4>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stat.monthly || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Monthly: {formatCurrency(stat.monthly || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Annual: {formatCurrency(stat.annual || 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'statements_summary':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-2 text-left">Account</th>
                  <th className="border border-gray-200 p-2 text-left">Period</th>
                  <th className="border border-gray-200 p-2 text-right">Credits</th>
                  <th className="border border-gray-200 p-2 text-right">Debits</th>
                  <th className="border border-gray-200 p-2 text-right">Net Flow</th>
                  <th className="border border-gray-200 p-2 text-right">Avg Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((summary: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-2">{summary.account}</td>
                    <td className="border border-gray-200 p-2">
                      {summary.statement_month} {summary.statement_year}
                    </td>
                    <td className="border border-gray-200 p-2 text-right text-green-600">
                      {formatCurrency(summary.total_credits || 0)}
                    </td>
                    <td className="border border-gray-200 p-2 text-right text-red-600">
                      {formatCurrency(summary.total_debits || 0)}
                    </td>
                    <td className="border border-gray-200 p-2 text-right">
                      {formatCurrency(summary.net_cashflow || 0)}
                    </td>
                    <td className="border border-gray-200 p-2 text-right">
                      {formatCurrency(summary.avg_balance || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'mca_companies':
        return (
          <div className="space-y-4">
            {filteredData.map((company: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {company.company}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Withdrawals</div>
                      <div className="font-medium">{company.withdrawalcount}</div>
                      <div className="text-sm text-red-600">{company.withdrawaltotal}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Deposits</div>
                      <div className="font-medium">{company.depositcount}</div>
                      <div className="text-sm text-green-600">{company.deposittotal}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Withhold %</div>
                      <div className="font-medium">{company.withholdpercent}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Term</div>
                      <div className="font-medium">{company.term}</div>
                    </div>
                  </div>
                  
                  {company.months && company.months.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Monthly Breakdown</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 p-1 text-left">Month</th>
                              <th className="border border-gray-200 p-1 text-right">Withdrawals</th>
                              <th className="border border-gray-200 p-1 text-right">Deposits</th>
                            </tr>
                          </thead>
                          <tbody>
                            {company.months.map((month: any, mIndex: number) => (
                              <tr key={mIndex}>
                                <td className="border border-gray-200 p-1">{month.month}</td>
                                <td className="border border-gray-200 p-1 text-right text-red-600">
                                  {month.withdrawaltotal}
                                </td>
                                <td className="border border-gray-200 p-1 text-right text-green-600">
                                  {month.deposittotal}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        // Handle transaction-type sections
        if (Array.isArray(filteredData) && filteredData.length > 0) {
          return (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-left">Date</th>
                    <th className="border border-gray-200 p-2 text-left">Description</th>
                    <th className="border border-gray-200 p-2 text-right">Amount</th>
                    {filteredData[0].memo && <th className="border border-gray-200 p-2 text-left">Memo</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 50).map((transaction: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="border border-gray-200 p-2 max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td className="border border-gray-200 p-2 text-right">
                        {formatCurrency(transaction.amount)}
                      </td>
                      {transaction.memo && (
                        <td className="border border-gray-200 p-2 max-w-xs truncate">
                          {transaction.memo}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length > 50 && (
                <div className="p-4 text-center text-gray-500">
                  Showing first 50 of {filteredData.length} transactions
                </div>
              )}
            </div>
          );
        }
        
        // Handle object-type data
        return (
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(filteredData, null, 2)}
          </pre>
        );
    }
  };

  const formatSectionName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/scorecards')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scorecards
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Scorecard Details</h1>
          <p className="text-muted-foreground">App ID: {scorecard.external_app_id}</p>
        </div>
        {scorecard.scorecard_url && (
          <Button
            variant="outline"
            onClick={() => window.open(scorecard.scorecard_url!, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open External Report
          </Button>
        )}
      </div>

      {/* Scorecard Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <Badge variant={scorecard.status === 'completed' ? 'default' : 'secondary'}>
                {scorecard.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-500">Generated</div>
              <div>{formatDate(scorecard.requested_at)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Completed</div>
              <div>{scorecard.completed_at ? formatDate(scorecard.completed_at) : 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Sections</div>
              <div>{sections.length} sections</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {(accounts.length > 0 || months.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {accounts.length > 0 && (
                <div className="w-48">
                  <label className="text-sm font-medium">Account</label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map(account => (
                        <SelectItem key={account} value={account}>
                          {account}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {months.length > 0 && (
                <div className="w-48">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {months.map(month => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scorecard Sections */}
      {sections.length > 0 ? (
        <Tabs defaultValue={sections[0]?.section_name} className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            {sections.map((section) => (
              <TabsTrigger
                key={section.section_name}
                value={section.section_name}
                className="text-xs"
              >
                {formatSectionName(section.section_name)}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.section_name} value={section.section_name}>
              <Card>
                <CardHeader>
                  <CardTitle>{formatSectionName(section.section_name)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderSectionContent(section)}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-500">
              This scorecard doesn't have any processed data sections yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScorecardDetails;
