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
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-effect border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/20 rounded-xl mr-3">
                <div className="w-5 h-5 bg-primary rounded-md"></div>
              </div>
              <h1 className="text-2xl font-bold text-primary">Greenvest Capital</h1>
            </div>
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 shadow-lg shadow-primary/25">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
            MCA Deal Management
            <span className="block text-primary mt-2">Made Simple</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            Streamline your Merchant Cash Advance operations with our comprehensive CRM system. 
            Track deals, manage clients, and optimize your funding pipeline.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-4 text-lg shadow-lg shadow-primary/25">
                Access Dashboard
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
                <div key={feature.title} className="card-gradient rounded-2xl p-6 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="mx-auto h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="card-gradient rounded-2xl p-12 shadow-2xl border border-primary/20">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to access your dashboard?</h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Sign in to Greenvest Capital's deal management platform.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-4 text-lg shadow-lg shadow-primary/25">
                Sign In Now
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
