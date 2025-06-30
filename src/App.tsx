
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Index from '@/pages/Index';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/pages/Dashboard';
import Deals from '@/pages/Deals';
import DealDetails from '@/pages/DealDetails';
import Companies from '@/pages/Companies';
import CompanyDetails from '@/pages/CompanyDetails';
import Analytics from '@/pages/Analytics';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deals" element={
        <ProtectedRoute>
          <Layout>
            <Deals />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deals/:id" element={
        <ProtectedRoute>
          <Layout>
            <DealDetails />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/companies" element={
        <ProtectedRoute>
          <Layout>
            <Companies />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/companies/:id" element={
        <ProtectedRoute>
          <Layout>
            <CompanyDetails />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Layout>
            <Analytics />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  </QueryClientProvider>
);

export default App;
