
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, DollarSign, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: DollarSign,
      title: "Deal Tracking",
      description: "Track MCA applications from initial contact through funding completion"
    },
    {
      icon: Building2,
      title: "Company Management",
      description: "Manage client companies and their detailed information"
    },
    {
      icon: TrendingUp,
      title: "Pipeline Analytics",
      description: "Monitor conversion rates and pipeline performance"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Enterprise-grade security for sensitive financial data"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-900">Greenvest Capital</h1>
            </div>
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            MCA Deal Management
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your Merchant Cash Advance operations with our comprehensive CRM system. 
            Track deals, manage clients, and optimize your funding pipeline.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-blue-600 text-white">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-xl mb-8 text-blue-100">
                Join Greenvest Capital's deal management platform today.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary">
                  Sign Up Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
