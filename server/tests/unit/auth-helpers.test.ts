import { describe, it, expect } from 'vitest';
import {
  AuthContext,
  createAuthError,
  isManagerOrAdmin,
  assertResourceOwnership,
  assertCanModifyTask,
  assertCanAssignTask,
  assertCanAssignLead,
  assertCanConvertLead,
  assertCanModifyOpportunity,
  assertCanModifyDocument,
  assertCanModifyCampaign,
  assertCanApproveQuote,
  assertCanModifyOrder,
  assertCanModifyCase
} from '../../src/utils/auth-helpers.js';

describe('auth-helpers (unit)', () => {
  const superAdminContext: AuthContext = {
    userId: 'admin-1',
    organizationId: 'org-1',
    role: 'SUPER_ADMIN',
    email: 'admin@vynexa.com'
  };

  const salesManagerContext: AuthContext = {
    userId: 'mgr-1',
    organizationId: 'org-1',
    role: 'SALES_MANAGER',
    email: 'manager@vynexa.com'
  };

  const salesRepContext: AuthContext = {
    userId: 'rep-1',
    organizationId: 'org-1',
    role: 'SALES_REPRESENTATIVE',
    email: 'rep1@vynexa.com'
  };

  const marketingManagerContext: AuthContext = {
    userId: 'mkt-1',
    organizationId: 'org-1',
    role: 'MARKETING_MANAGER',
    email: 'mkt@vynexa.com'
  };

  const opsFinanceContext: AuthContext = {
    userId: 'ops-1',
    organizationId: 'org-1',
    role: 'OPERATIONS_FINANCE',
    email: 'ops@vynexa.com'
  };

  const supportManagerContext: AuthContext = {
    userId: 'sup-mgr-1',
    organizationId: 'org-1',
    role: 'SUPPORT_MANAGER',
    email: 'supmgr@vynexa.com'
  };

  const customerSupportContext: AuthContext = {
    userId: 'sup-agent-1',
    organizationId: 'org-1',
    role: 'CUSTOMER_SUPPORT',
    email: 'supagent@vynexa.com'
  };

  describe('createAuthError', () => {
    it('creates an AppError with statusCode and code', () => {
      const err = createAuthError(403, 'FORBIDDEN', 'Access denied');
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toBe('Access denied');
    });
  });

  describe('isManagerOrAdmin', () => {
    it('returns true for SUPER_ADMIN on any domain', () => {
      expect(isManagerOrAdmin(superAdminContext, 'sales')).toBe(true);
      expect(isManagerOrAdmin(superAdminContext, 'marketing')).toBe(true);
      expect(isManagerOrAdmin(superAdminContext, 'operations')).toBe(true);
      expect(isManagerOrAdmin(superAdminContext, 'support')).toBe(true);
    });

    it('handles sales domains correctly', () => {
      expect(isManagerOrAdmin(salesManagerContext, 'sales')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'tasks')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'leads')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'opportunities')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'accounts')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'contacts')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'quotes')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'pipelines')).toBe(true);
      expect(isManagerOrAdmin(salesRepContext, 'sales')).toBe(false);
    });

    it('handles marketing domains correctly', () => {
      expect(isManagerOrAdmin(marketingManagerContext, 'marketing')).toBe(true);
      expect(isManagerOrAdmin(marketingManagerContext, 'campaigns')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'marketing')).toBe(true);
      expect(isManagerOrAdmin(salesRepContext, 'marketing')).toBe(false);
    });

    it('handles operations / finance domains correctly', () => {
      expect(isManagerOrAdmin(opsFinanceContext, 'operations')).toBe(true);
      expect(isManagerOrAdmin(opsFinanceContext, 'finance')).toBe(true);
      expect(isManagerOrAdmin(opsFinanceContext, 'orders')).toBe(true);
      expect(isManagerOrAdmin(opsFinanceContext, 'products')).toBe(true);
      expect(isManagerOrAdmin(salesManagerContext, 'orders')).toBe(true);
      expect(isManagerOrAdmin(salesRepContext, 'orders')).toBe(false);
    });

    it('handles support domains correctly', () => {
      expect(isManagerOrAdmin(salesManagerContext, 'support')).toBe(true);
      expect(isManagerOrAdmin(supportManagerContext, 'support_cases')).toBe(true);
      expect(isManagerOrAdmin(customerSupportContext, 'support')).toBe(true);
      expect(isManagerOrAdmin(salesRepContext, 'support')).toBe(false);
    });

    it('handles default domain fallback', () => {
      expect(isManagerOrAdmin(salesManagerContext, 'unknown_domain')).toBe(true);
      expect(isManagerOrAdmin(salesRepContext, 'unknown_domain')).toBe(false);
    });
  });

  describe('assertResourceOwnership', () => {
    it('throws 404 NOT_FOUND when tenant mismatch', () => {
      expect(() => {
        assertResourceOwnership(salesRepContext, {
          organizationId: 'other-org'
        });
      }).toThrowError('Resource was not found or belongs to another organization.');
    });

    it('returns true if caller is manager or admin', () => {
      const result = assertResourceOwnership(salesManagerContext, {
        organizationId: 'org-1'
      });
      expect(result).toBe(true);
    });

    it('returns true if caller is direct owner', () => {
      const result = assertResourceOwnership(salesRepContext, {
        organizationId: 'org-1',
        ownerId: 'rep-1'
      });
      expect(result).toBe(true);
    });

    it('returns true if caller is assignee when allowAssignee is true', () => {
      const result = assertResourceOwnership(
        salesRepContext,
        { organizationId: 'org-1', assignedToId: 'rep-1' },
        { allowAssignee: true }
      );
      expect(result).toBe(true);
    });

    it('returns true if caller is creator when allowCreator is true', () => {
      const result = assertResourceOwnership(
        salesRepContext,
        { organizationId: 'org-1', createdById: 'rep-1' },
        { allowCreator: true }
      );
      expect(result).toBe(true);
    });

    it('returns true if caller is uploader when allowCreator is true', () => {
      const result = assertResourceOwnership(
        salesRepContext,
        { organizationId: 'org-1', uploadedById: 'rep-1' },
        { allowCreator: true }
      );
      expect(result).toBe(true);
    });

    it('throws 403 FORBIDDEN with default message when unauthorized', () => {
      expect(() => {
        assertResourceOwnership(salesRepContext, {
          organizationId: 'org-1',
          ownerId: 'rep-2'
        });
      }).toThrowError('You do not have permission to modify this resource.');
    });

    it('throws 403 FORBIDDEN with custom actionDescription when provided', () => {
      expect(() => {
        assertResourceOwnership(
          salesRepContext,
          { organizationId: 'org-1', ownerId: 'rep-2' },
          { actionDescription: 'Custom action blocked' }
        );
      }).toThrowError('Custom action blocked');
    });
  });

  describe('assertCanModifyTask & assertCanAssignTask', () => {
    const task = {
      organizationId: 'org-1',
      assignedToId: 'rep-1',
      createdById: 'rep-creator'
    };

    it('allows assignee to modify and reassign task', () => {
      expect(assertCanModifyTask(salesRepContext, task, 'complete')).toBe(true);
      expect(assertCanAssignTask(salesRepContext, task)).toBe(true);
    });

    it('allows creator to modify and reassign task', () => {
      const creatorContext: AuthContext = { ...salesRepContext, userId: 'rep-creator' };
      expect(assertCanModifyTask(creatorContext, task, 'delete')).toBe(true);
      expect(assertCanAssignTask(creatorContext, task)).toBe(true);
    });

    it('allows manager to modify and reassign task', () => {
      expect(assertCanModifyTask(salesManagerContext, task, 'reopen')).toBe(true);
      expect(assertCanAssignTask(salesManagerContext, task)).toBe(true);
    });

    it('blocks unassigned non-creator rep', () => {
      const otherRepContext: AuthContext = { ...salesRepContext, userId: 'rep-unrelated' };
      expect(() => assertCanModifyTask(otherRepContext, task, 'complete')).toThrowError(
        'You do not have permission to complete this task because it is assigned to another user.'
      );
      expect(() => assertCanAssignTask(otherRepContext, task)).toThrowError(
        'You do not have permission to reassign this task because it is assigned to another user.'
      );
    });
  });

  describe('assertCanAssignLead & assertCanConvertLead', () => {
    const lead = {
      organizationId: 'org-1',
      ownerId: 'rep-1'
    };

    it('allows owner to assign and convert lead', () => {
      expect(assertCanAssignLead(salesRepContext, lead)).toBe(true);
      expect(assertCanConvertLead(salesRepContext, lead)).toBe(true);
    });

    it('allows sales manager to assign and convert lead', () => {
      expect(assertCanAssignLead(salesManagerContext, lead)).toBe(true);
      expect(assertCanConvertLead(salesManagerContext, lead)).toBe(true);
    });

    it('blocks non-owner sales rep', () => {
      const otherRep: AuthContext = { ...salesRepContext, userId: 'rep-2' };
      expect(() => assertCanAssignLead(otherRep, lead)).toThrowError(
        'You do not have permission to reassign this lead because you are not the assigned owner.'
      );
      expect(() => assertCanConvertLead(otherRep, lead)).toThrowError(
        'You do not have permission to convert this lead because you are not the assigned owner.'
      );
    });
  });

  describe('assertCanModifyOpportunity', () => {
    const opp = {
      organizationId: 'org-1',
      ownerId: 'rep-1'
    };

    it('allows owner to modify opportunity', () => {
      expect(assertCanModifyOpportunity(salesRepContext, opp, 'win')).toBe(true);
    });

    it('allows manager to modify opportunity', () => {
      expect(assertCanModifyOpportunity(salesManagerContext, opp, 'delete')).toBe(true);
    });

    it('blocks non-owner sales rep', () => {
      const otherRep: AuthContext = { ...salesRepContext, userId: 'rep-2' };
      expect(() => assertCanModifyOpportunity(otherRep, opp, 'update')).toThrowError(
        'You do not have permission to update this opportunity because you are not the assigned owner.'
      );
    });
  });

  describe('assertCanModifyDocument', () => {
    const doc = {
      organizationId: 'org-1',
      uploadedById: 'rep-1'
    };

    it('allows uploader to modify document', () => {
      expect(assertCanModifyDocument(salesRepContext, doc, 'delete')).toBe(true);
    });

    it('allows sales manager to modify document', () => {
      expect(assertCanModifyDocument(salesManagerContext, doc, 'delete')).toBe(true);
    });

    it('blocks non-uploader sales rep', () => {
      const otherRep: AuthContext = { ...salesRepContext, userId: 'rep-2' };
      expect(() => assertCanModifyDocument(otherRep, doc, 'update')).toThrowError(
        'You do not have permission to update this document because you did not upload it.'
      );
    });
  });

  describe('assertCanModifyCampaign', () => {
    const campaign = {
      organizationId: 'org-1',
      createdById: 'mkt-1'
    };

    it('allows campaign creator to modify campaign', () => {
      expect(assertCanModifyCampaign(marketingManagerContext, campaign, 'update')).toBe(true);
    });

    it('allows marketing manager and sales manager to modify campaign', () => {
      expect(assertCanModifyCampaign(salesManagerContext, campaign, 'delete')).toBe(true);
    });

    it('blocks sales rep from modifying campaign', () => {
      expect(() => assertCanModifyCampaign(salesRepContext, campaign, 'change status of')).toThrowError(
        'You do not have permission to change status of this campaign. Marketing manager or administrator role required.'
      );
    });
  });

  describe('assertCanApproveQuote', () => {
    const quote = { organizationId: 'org-1' };

    it('throws 404 on organization mismatch', () => {
      expect(() => assertCanApproveQuote(salesManagerContext, { organizationId: 'other-org' })).toThrowError(
        'Quote was not found in your organization.'
      );
    });

    it('allows SUPER_ADMIN and SALES_MANAGER to approve quote', () => {
      expect(assertCanApproveQuote(superAdminContext, quote)).toBe(true);
      expect(assertCanApproveQuote(salesManagerContext, quote)).toBe(true);
    });

    it('blocks regular sales rep from approving quote with 403', () => {
      expect(() => assertCanApproveQuote(salesRepContext, quote)).toThrowError(
        'You do not have permission to approve or reject quotes. Managerial authorization is required.'
      );
    });
  });

  describe('assertCanModifyOrder', () => {
    const order = { organizationId: 'org-1' };

    it('throws 404 on organization mismatch', () => {
      expect(() => assertCanModifyOrder(salesManagerContext, { organizationId: 'other-org' }, 'confirm')).toThrowError(
        'Order was not found in your organization.'
      );
    });

    it('allows SUPER_ADMIN, OPERATIONS_FINANCE, and SALES_MANAGER to modify order', () => {
      expect(assertCanModifyOrder(superAdminContext, order, 'confirm')).toBe(true);
      expect(assertCanModifyOrder(opsFinanceContext, order, 'process')).toBe(true);
      expect(assertCanModifyOrder(salesManagerContext, order, 'cancel')).toBe(true);
    });

    it('blocks regular sales rep from modifying order with 403', () => {
      expect(() => assertCanModifyOrder(salesRepContext, order, 'confirm')).toThrowError(
        'You do not have permission to confirm this order. Operations or managerial role required.'
      );
    });
  });

  describe('assertCanModifyCase', () => {
    const supportCase = {
      organizationId: 'org-1',
      assignedToId: 'agent-1',
      createdById: 'agent-creator'
    };

    it('throws 404 on organization mismatch', () => {
      expect(() => assertCanModifyCase(salesManagerContext, { organizationId: 'other-org' }, 'resolve')).toThrowError(
        'Support case was not found in your organization.'
      );
    });

    it('allows claiming or assigning an unassigned case', () => {
      const unassignedCase = { organizationId: 'org-1', assignedToId: null, createdById: 'user-x' };
      expect(assertCanModifyCase(salesRepContext, unassignedCase, 'assign')).toBe(true);
      expect(assertCanModifyCase(salesRepContext, unassignedCase, 'claim')).toBe(true);
    });

    it('allows assignee to modify case', () => {
      const assigneeContext: AuthContext = { ...salesRepContext, userId: 'agent-1' };
      expect(assertCanModifyCase(assigneeContext, supportCase, 'resolve')).toBe(true);
    });

    it('allows creator to modify case', () => {
      const creatorContext: AuthContext = { ...salesRepContext, userId: 'agent-creator' };
      expect(assertCanModifyCase(creatorContext, supportCase, 'close')).toBe(true);
    });

    it('allows manager to modify case', () => {
      expect(assertCanModifyCase(salesManagerContext, supportCase, 'delete')).toBe(true);
    });

    it('blocks unrelated agent from modifying assigned case', () => {
      const otherContext: AuthContext = { ...salesRepContext, userId: 'other-agent' };
      expect(() => assertCanModifyCase(otherContext, supportCase, 'resolve')).toThrowError(
        'You do not have permission to resolve this support case because it is assigned to another agent.'
      );
    });
  });
});
