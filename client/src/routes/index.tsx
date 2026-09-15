import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ApplicationShell } from '@/layouts/ApplicationShell';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { LeadsPage } from '@/pages/app/LeadsPage';
import { LeadDetailPage } from '@/pages/app/LeadDetailPage';
import { CustomersPage } from '@/pages/app/CustomersPage';
import { CustomerDetailPage } from '@/pages/app/CustomerDetailPage';
import { ContactsPage } from '@/pages/app/ContactsPage';
import { ContactDetailPage } from '@/pages/app/ContactDetailPage';
import { PipelinePage } from '@/pages/app/PipelinePage';
import { OpportunitiesPage } from '@/pages/app/OpportunitiesPage';
import { OpportunityDetailPage } from '@/pages/app/OpportunityDetailPage';
import { ActivitiesPage } from '@/pages/app/ActivitiesPage';
import { TasksPage } from '@/pages/app/TasksPage';
import { FollowUpsPage } from '@/pages/app/FollowUpsPage';
import { ProductsPage } from '@/pages/app/ProductsPage';
import { ProductDetailPage } from '@/pages/app/ProductDetailPage';
import { QuotesPage } from '@/pages/app/QuotesPage';
import { QuoteDetailPage } from '@/pages/app/QuoteDetailPage';
import { OrdersPage } from '@/pages/app/OrdersPage';
import { OrderDetailPage } from '@/pages/app/OrderDetailPage';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsersPage } from '@/pages/app/UsersPage';
import { RolesPage } from '@/pages/app/RolesPage';
import { OrganizationSettingsPage } from '@/pages/app/OrganizationSettingsPage';
import { DocumentsPage } from '@/pages/app/DocumentsPage';
import { DocumentDetailPage } from '@/pages/app/DocumentDetailPage';
import { NotificationsPage } from '@/pages/app/NotificationsPage';
import { SupportCasesPage } from '@/pages/app/SupportCasesPage';
import { SupportCaseDetailPage } from '@/pages/app/SupportCaseDetailPage';
import { CampaignsPage } from '@/pages/app/CampaignsPage';
import { CampaignDetailPage } from '@/pages/app/CampaignDetailPage';
import { ReportsPage } from '@/pages/app/ReportsPage';
import { AuditLogsPage } from '@/pages/app/AuditLogsPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// Redirect authenticated users away from public auth pages
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (!loading && isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
};

// Generic module placeholder for routes defined in sidebar but implemented in future roadmap phases
const ModulePlaceholder: React.FC<{ title: string; phase: string }> = ({ title, phase }) => (
  <div className="space-y-6">
    <PageHeader
      title={title}
      description={`Visual shell layout for ${title.toLowerCase()}.`}
      breadcrumbs={[
        { label: 'Application', href: '/app/dashboard' },
        { label: title }
      ]}
    />
    <Card className="bg-vynexa-surface border-vynexa-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title} Module Shell</CardTitle>
          <CardDescription>
            This module will be fully implemented with relational database models and domain business logic in later roadmap phases.
          </CardDescription>
        </div>
        <Badge variant="slate">{phase}</Badge>
      </CardHeader>
    </Card>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Experience Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<ApplicationShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="pipeline" element={<PipelinePage />} />

          {/* Navigation redirect for legacy /app/organizations */}
          <Route path="organizations" element={<Navigate to="/app/settings" replace />} />
          <Route path="opportunities" element={<OpportunitiesPage />} />
          <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="quotes/:id" element={<QuoteDetailPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="support" element={<SupportCasesPage />} />
          <Route path="support-cases/:id" element={<SupportCaseDetailPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="settings" element={<OrganizationSettingsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
