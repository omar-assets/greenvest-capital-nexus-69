import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
const Companies = () => {
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-300">Companies</h1>
          <p className="text-gray-600 mt-1">
            Manage your client companies and their information.
          </p>
        </div>
        <Button className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Company Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-500 mb-4">
              Start by adding your first client company to track their deals and information.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First Company
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Companies;