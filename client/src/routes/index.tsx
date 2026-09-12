import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ApplicationShell } from '@/layouts/ApplicationShell';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { LeadsPage } from '@/pages/app/LeadsPage';
import { CustomersPage } from '@/pages/app/CustomersPage';
import { ContactsPage } from '@/pages/app/ContactsPage';
import { PipelinePage } from '@/pages/app/PipelinePage';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsersPage } from '@/pages/app/UsersPage';
import { RolesPage } from '@/pages/app/RolesPage';
import { OrganizationSettingsPage } from '@/pages/app/OrganizationSettingsPage';
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
          <Route path="customers" element={<CustomersPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="pipeline" element={<PipelinePage />} />

          {/* Navigation placeholders matching AGENTS.md footprint */}
          <Route path="organizations" element={<OrganizationSettingsPage />} />
          <Route path="opportunities" element={<ModulePlaceholder title="Opportunities" phase="Phase 9" />} />
          <Route path="quotes" element={<ModulePlaceholder title="Quotes" phase="Phase 11" />} />
          <Route path="orders" element={<ModulePlaceholder title="Orders" phase="Phase 11" />} />
          <Route path="products" element={<ModulePlaceholder title="Products Catalog" phase="Phase 11" />} />
          <Route path="tasks" element={<ModulePlaceholder title="Tasks" phase="Phase 10" />} />
          <Route path="activities" element={<ModulePlaceholder title="Activities" phase="Phase 10" />} />
          <Route path="follow-ups" element={<ModulePlaceholder title="Follow-ups" phase="Phase 10" />} />
          <Route path="documents" element={<ModulePlaceholder title="Documents" phase="Phase 12" />} />
          <Route path="support" element={<ModulePlaceholder title="Support Cases" phase="Phase 12" />} />
          <Route path="campaigns" element={<ModulePlaceholder title="Marketing Campaigns" phase="Phase 13" />} />
          <Route path="reports" element={<ModulePlaceholder title="Reports & Analytics" phase="Phase 13" />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="settings" element={<OrganizationSettingsPage />} />
          <Route path="audit-logs" element={<ModulePlaceholder title="Audit Logs" phase="Phase 14" />} />
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
