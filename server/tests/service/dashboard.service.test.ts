import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { clearTestDb, disconnectTestDb, prismaTest } from '../helpers/testDb.js';
import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';
import { dashboardService } from '../../src/modules/dashboard/dashboard.service.js';

describe('DashboardService (unit & database integration)', () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('getDashboardOverview', () => {
    it('should return default zero metrics and empty lists for clean organization', async () => {
      const org = await createTestOrg({ name: 'Empty Org', currency: 'EUR' });
      const role = await createTestRole({ organizationId: org.id, name: 'SALES_MANAGER' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });

      await prismaTest.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Empty Pipeline',
          stages: {
            create: [{ name: 'Qualification', order: 1, probability: 0.2 }]
          }
        }
      });

      const overview = await dashboardService.getDashboardOverview(org.id, user.id);

      expect(overview.organization.name).toBe('Empty Org');
      expect(overview.organization.currency).toBe('EUR');
      expect(overview.metrics.totalLeads).toBe(0);
      expect(overview.metrics.activeOpportunities).toBe(0);
      expect(overview.metrics.pipelineValue).toBe(0);
      expect(overview.metrics.openTasks).toBe(0);
      expect(overview.metrics.overdueTasks).toBe(0);
      expect(overview.recentActivities).toEqual([]);
      expect(overview.tasks).toEqual([]);
      expect(overview.notifications.items).toEqual([]);
      expect(overview.notifications.unreadCount).toBe(0);
    });

    it('should accurately calculate total leads, pipeline aggregates, and overdue tasks', async () => {
      const org = await createTestOrg({ name: 'Metrics Test Org', currency: 'INR' });
      const role = await createTestRole({ organizationId: org.id, name: 'SALES_MANAGER' });
      const user = await createTestUser({ organizationId: org.id, roleId: role.id });

      // Seed 2 Leads
      await prismaTest.lead.createMany({
        data: [
          { organizationId: org.id, firstName: 'L1', lastName: 'Test' },
          { organizationId: org.id, firstName: 'L2', lastName: 'Test' }
        ]
      });

      // Seed Pipeline & Stage
      const pipeline = await prismaTest.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Main Pipeline',
          stages: {
            create: [
              { name: 'Qualification', order: 1, probability: 0.2 },
              { name: 'Proposal', order: 2, probability: 0.5 }
            ]
          }
        },
        include: { stages: true }
      });

      const qualStage = pipeline.stages[0];

      // Seed Opportunities (1 OPEN value 50000, 1 WON value 30000)
      await prismaTest.opportunity.create({
        data: {
          organizationId: org.id,
          pipelineId: pipeline.id,
          stageId: qualStage.id,
          name: 'Big Tech Deal',
          value: 50000,
          status: 'OPEN'
        }
      });

      await prismaTest.opportunity.create({
        data: {
          organizationId: org.id,
          pipelineId: pipeline.id,
          stageId: qualStage.id,
          name: 'Small Cloud Deal',
          value: 30000,
          status: 'WON'
        }
      });

      // Seed Tasks (1 Upcoming, 1 Overdue)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prismaTest.task.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          title: 'Overdue Follow-up',
          dueDate: yesterday,
          status: 'TODO',
          priority: 'URGENT'
        }
      });

      await prismaTest.task.create({
        data: {
          organizationId: org.id,
          createdById: user.id,
          title: 'Upcoming Demo',
          dueDate: tomorrow,
          status: 'IN_PROGRESS',
          priority: 'HIGH'
        }
      });

      // Seed Notification for User
      await prismaTest.notification.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: 'Overdue Follow-up assigned to you.',
          isRead: false
        }
      });

      const overview = await dashboardService.getDashboardOverview(org.id, user.id);

      expect(overview.metrics.totalLeads).toBe(2);
      expect(overview.metrics.activeOpportunities).toBe(1);
      expect(overview.metrics.wonOpportunities).toBe(1);
      expect(overview.metrics.pipelineValue).toBe(50000);
      expect(overview.metrics.openTasks).toBe(2);
      expect(overview.metrics.overdueTasks).toBe(1);

      expect(overview.pipeline.length).toBe(2);
      expect(overview.tasks.length).toBe(2);
      expect(overview.tasks[0].isOverdue).toBe(true);
      expect(overview.notifications.unreadCount).toBe(1);
      expect(overview.notifications.items.length).toBe(1);
    });

    it('should isolate user-specific notifications to the target user only', async () => {
      const org = await createTestOrg();
      const role = await createTestRole({ organizationId: org.id, name: 'SALES_MANAGER' });
      const user1 = await createTestUser({ organizationId: org.id, roleId: role.id });
      const user2 = await createTestUser({ organizationId: org.id, roleId: role.id });

      // Create Notification for User 1 only
      await prismaTest.notification.create({
        data: {
          organizationId: org.id,
          userId: user1.id,
          type: 'INFO',
          title: 'User 1 Secret Note',
          message: 'Personal update',
          isRead: false
        }
      });

      const overviewUser1 = await dashboardService.getDashboardOverview(org.id, user1.id);
      const overviewUser2 = await dashboardService.getDashboardOverview(org.id, user2.id);

      expect(overviewUser1.notifications.unreadCount).toBe(1);
      expect(overviewUser1.notifications.items[0].title).toBe('User 1 Secret Note');

      expect(overviewUser2.notifications.unreadCount).toBe(0);
      expect(overviewUser2.notifications.items).toEqual([]);
    });
  });
});
