import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { rolesRoutes, permissionsRoutes } from './modules/roles/roles.routes.js';
import { organizationRoutes } from './modules/organization/organization.routes.js';
import { leadsRoutes } from './modules/leads/leads.routes.js';
import { accountsRoutes } from './modules/accounts/accounts.routes.js';
import { contactsRoutes } from './modules/contacts/contacts.routes.js';
import { opportunitiesRoutes } from './modules/opportunities/opportunities.routes.js';
import { pipelinesRoutes, pipelineStagesRoutes } from './modules/pipelines/pipelines.routes.js';
import { activitiesRoutes } from './modules/activities/activities.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { quotesRoutes } from './modules/quotes/quotes.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { documentsRoutes } from './modules/documents/documents.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { supportCasesRoutes } from './modules/support/support.routes.js';
import { campaignsRoutes } from './modules/campaigns/campaigns.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { auditLogsRoutes } from './modules/audit-logs/audit-logs.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { authRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware setup
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/customers', accountsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/pipelines', pipelinesRoutes);
app.use('/api/pipeline-stages', pipelineStagesRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/support-cases', supportCasesRoutes);
app.use('/api/support', supportCasesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/search', searchRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint was not found on this server.'
    }
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
