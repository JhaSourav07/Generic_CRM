import React, { Suspense, lazy } from 'react';
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
import { NotificationsPage } from '@/pages/app/NotificationsPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoadingFallback } from '@/components/common/PageLoadingFallback';
import { useAuth } from '@/context/AuthContext';

// Route-level Code Splitting for heavy operational and analytical modules
const ProductsPage = lazy(() => import('@/pages/app/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('@/pages/app/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const QuotesPage = lazy(() => import('@/pages/app/QuotesPage').then((m) => ({ default: m.QuotesPage })));
const QuoteDetailPage = lazy(() => import('@/pages/app/QuoteDetailPage').then((m) => ({ default: m.QuoteDetailPage })));
const OrdersPage = lazy(() => import('@/pages/app/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/pages/app/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const DocumentsPage = lazy(() => import('@/pages/app/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const DocumentDetailPage = lazy(() => import('@/pages/app/DocumentDetailPage').then((m) => ({ default: m.DocumentDetailPage })));
const SupportCasesPage = lazy(() => import('@/pages/app/SupportCasesPage').then((m) => ({ default: m.SupportCasesPage })));
const SupportCaseDetailPage = lazy(() => import('@/pages/app/SupportCaseDetailPage').then((m) => ({ default: m.SupportCaseDetailPage })));
const CampaignsPage = lazy(() => import('@/pages/app/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const CampaignDetailPage = lazy(() => import('@/pages/app/CampaignDetailPage').then((m) => ({ default: m.CampaignDetailPage })));
const ReportsPage = lazy(() => import('@/pages/app/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('@/pages/app/UsersPage').then((m) => ({ default: m.UsersPage })));
const RolesPage = lazy(() => import('@/pages/app/RolesPage').then((m) => ({ default: m.RolesPage })));
const OrganizationSettingsPage = lazy(() => import('@/pages/app/OrganizationSettingsPage').then((m) => ({ default: m.OrganizationSettingsPage })));
const AuditLogsPage = lazy(() => import('@/pages/app/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));

// Redirect authenticated users away from public auth pages
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (!loading && isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
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

            <Route path="tasks" element={<TasksPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="follow-ups" element={<FollowUpsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Code-split Analytical & Commercial Routes */}
            <Route
              path="quotes"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <QuotesPage />
                </Suspense>
              }
            />
            <Route
              path="quotes/:id"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <QuoteDetailPage />
                </Suspense>
              }
            />
            <Route
              path="orders"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <OrdersPage />
                </Suspense>
              }
            />
            <Route
              path="orders/:id"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <OrderDetailPage />
                </Suspense>
              }
            />
            <Route
              path="products"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <ProductsPage />
                </Suspense>
              }
            />
            <Route
              path="products/:id"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <ProductDetailPage />
                </Suspense>
              }
            />
            <Route
              path="documents"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <DocumentsPage />
                </Suspense>
              }
            />
            <Route
              path="documents/:id"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <DocumentDetailPage />
                </Suspense>
              }
            />
            <Route
              path="support"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <SupportCasesPage />
                </Suspense>
              }
            />
            <Route
              path="support-cases/:id"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <SupportCaseDetailPage />
                </Suspense>
              }
            />
            <Route
              path="campaigns"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <CampaignsPage />
                </Suspense>
              }
            />
            <Route
              path="campaigns/:id"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <CampaignDetailPage />
                </Suspense>
              }
            />
            <Route
              path="reports"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <ReportsPage />
                </Suspense>
              }
            />
            <Route
              path="users"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <UsersPage />
                </Suspense>
              }
            />
            <Route
              path="roles"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <RolesPage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <OrganizationSettingsPage />
                </Suspense>
              }
            />
            <Route
              path="audit-logs"
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AuditLogsPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* Fallback Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};
