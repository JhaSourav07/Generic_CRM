import { AuthContext, isSuperAdmin } from './rbac.js';
import { AppError } from '../middleware/errorHandler.js';

export { AuthContext };

export function createAuthError(
  statusCode: number,
  code: string,
  message: string
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

/**
 * Checks whether the user holds an administrative or managerial role for the specified CRM domain.
 * Super Admin always has full tenant management capability across all domains.
 */
export function isManagerOrAdmin(context: AuthContext, domain = 'sales'): boolean {
  if (isSuperAdmin(context)) {
    return true;
  }

  const role = context.role;

  switch (domain) {
    case 'sales':
    case 'tasks':
    case 'leads':
    case 'opportunities':
    case 'accounts':
    case 'contacts':
    case 'quotes':
    case 'pipelines':
      return role === 'SALES_MANAGER';

    case 'marketing':
    case 'campaigns':
      return role === 'MARKETING_MANAGER' || role === 'SALES_MANAGER';

    case 'operations':
    case 'finance':
    case 'orders':
    case 'products':
      return role === 'OPERATIONS_FINANCE' || role === 'SALES_MANAGER';

    case 'support':
    case 'support_cases':
      return role === 'SALES_MANAGER' || role === 'SUPPORT_MANAGER' || role === 'CUSTOMER_SUPPORT';

    default:
      return role === 'SALES_MANAGER';
  }
}

export interface ResourceOwnershipTarget {
  organizationId: string;
  ownerId?: string | null;
  assignedToId?: string | null;
  createdById?: string | null;
  uploadedById?: string | null;
}

export interface OwnershipOptions {
  domain?: string;
  allowAssignee?: boolean;
  allowCreator?: boolean;
  actionDescription?: string;
}

/**
 * Asserts that the caller is authorized to modify a specific resource:
 * 1. Checks tenant isolation (resource.organizationId === context.organizationId).
 * 2. Checks managerial or administrative override for the domain.
 * 3. Checks direct record ownership (ownerId === context.userId).
 * 4. Checks assignment or creator ownership when enabled.
 * Throws 404 if the resource does not belong to the organization.
 * Throws 403 if the user lacks ownership/managerial permission to mutate the record.
 */
export function assertResourceOwnership(
  context: AuthContext,
  resource: ResourceOwnershipTarget,
  options: OwnershipOptions = {}
): boolean {
  // 1. Tenant boundary check
  if (resource.organizationId !== context.organizationId) {
    throw createAuthError(
      404,
      'NOT_FOUND',
      'Resource was not found or belongs to another organization.'
    );
  }

  // 2. Managerial / Administrative privilege check
  if (isManagerOrAdmin(context, options.domain)) {
    return true;
  }

  // 3. Direct Record Owner Check
  if (resource.ownerId && resource.ownerId === context.userId) {
    return true;
  }

  // 4. Assignee Check
  if (
    options.allowAssignee &&
    resource.assignedToId &&
    resource.assignedToId === context.userId
  ) {
    return true;
  }

  // 5. Creator / Uploader Check
  if (
    options.allowCreator &&
    resource.createdById &&
    resource.createdById === context.userId
  ) {
    return true;
  }

  if (
    options.allowCreator &&
    resource.uploadedById &&
    resource.uploadedById === context.userId
  ) {
    return true;
  }

  // Caller lacks ownership and managerial rights
  const message =
    options.actionDescription ||
    'You do not have permission to modify this resource.';
  throw createAuthError(403, 'FORBIDDEN', message);
}

/**
 * Specifically validates task mutation authorization (complete, cancel, reopen, update, delete).
 * The caller must be the assignee, creator, or a sales manager/super admin.
 */
export function assertCanModifyTask(
  context: AuthContext,
  task: {
    organizationId: string;
    assignedToId?: string | null;
    createdById?: string | null;
  },
  action = 'modify'
): boolean {
  return assertResourceOwnership(context, task, {
    domain: 'tasks',
    allowAssignee: true,
    allowCreator: true,
    actionDescription: `You do not have permission to ${action} this task because it is assigned to another user.`
  });
}

/**
 * Validates task reassignment authorization.
 * Only the assignee, creator, or sales manager/super admin can reassign.
 */
export function assertCanAssignTask(
  context: AuthContext,
  task: {
    organizationId: string;
    assignedToId?: string | null;
    createdById?: string | null;
  }
): boolean {
  return assertResourceOwnership(context, task, {
    domain: 'tasks',
    allowAssignee: true,
    allowCreator: true,
    actionDescription:
      'You do not have permission to reassign this task because it is assigned to another user.'
  });
}

/**
 * Validates lead reassignment authorization.
 * Only the lead owner or a sales manager/super admin can reassign a lead.
 */
export function assertCanAssignLead(
  context: AuthContext,
  lead: { organizationId: string; ownerId?: string | null }
): boolean {
  return assertResourceOwnership(context, lead, {
    domain: 'leads',
    allowAssignee: false,
    allowCreator: false,
    actionDescription:
      'You do not have permission to reassign this lead because you are not the assigned owner.'
  });
}

/**
 * Validates lead conversion authorization.
 * Only the lead owner or a sales manager/super admin can convert a lead into a customer/opportunity.
 */
export function assertCanConvertLead(
  context: AuthContext,
  lead: { organizationId: string; ownerId?: string | null }
): boolean {
  return assertResourceOwnership(context, lead, {
    domain: 'leads',
    allowAssignee: false,
    allowCreator: false,
    actionDescription:
      'You do not have permission to convert this lead because you are not the assigned owner.'
  });
}

/**
 * Validates opportunity mutation authorization (update, stage change, win, lose, delete).
 * The caller must be the opportunity owner or a sales manager/super admin.
 */
export function assertCanModifyOpportunity(
  context: AuthContext,
  opportunity: { organizationId: string; ownerId?: string | null },
  action = 'modify'
): boolean {
  return assertResourceOwnership(context, opportunity, {
    domain: 'opportunities',
    allowAssignee: false,
    allowCreator: false,
    actionDescription: `You do not have permission to ${action} this opportunity because you are not the assigned owner.`
  });
}

/**
 * Validates document mutation authorization (update metadata, delete).
 * The caller must be the document uploader or a sales manager/super admin.
 */
export function assertCanModifyDocument(
  context: AuthContext,
  document: { organizationId: string; uploadedById?: string | null },
  action = 'modify'
): boolean {
  return assertResourceOwnership(context, document, {
    domain: 'sales',
    allowCreator: true,
    actionDescription: `You do not have permission to ${action} this document because you did not upload it.`
  });
}

/**
 * Validates campaign mutation authorization (update, change status, delete).
 * Marketing managers, sales managers, or super admins.
 */
export function assertCanModifyCampaign(
  context: AuthContext,
  campaign: { organizationId: string; createdById?: string | null },
  action = 'modify'
): boolean {
  return assertResourceOwnership(context, campaign, {
    domain: 'marketing',
    allowCreator: true,
    actionDescription: `You do not have permission to ${action} this campaign. Marketing manager or administrator role required.`
  });
}

/**
 * Validates quote approval and rejection authorization.
 * Strictly restricted to Sales Managers and Super Admins. Normal sales reps are rejected with 403.
 */
export function assertCanApproveQuote(
  context: AuthContext,
  quote: { organizationId: string }
): boolean {
  if (quote.organizationId !== context.organizationId) {
    throw createAuthError(
      404,
      'NOT_FOUND',
      'Quote was not found in your organization.'
    );
  }

  if (!isManagerOrAdmin(context, 'quotes')) {
    throw createAuthError(
      403,
      'FORBIDDEN',
      'You do not have permission to approve or reject quotes. Managerial authorization is required.'
    );
  }

  return true;
}

/**
 * Validates financial order status mutation (confirm, process, complete, cancel).
 * Operations/Finance, Sales Managers, and Super Admins only.
 */
export function assertCanModifyOrder(
  context: AuthContext,
  order: { organizationId: string },
  action: string
): boolean {
  if (order.organizationId !== context.organizationId) {
    throw createAuthError(
      404,
      'NOT_FOUND',
      'Order was not found in your organization.'
    );
  }

  if (isSuperAdmin(context)) {
    return true;
  }

  const allowedRoles = ['OPERATIONS_FINANCE', 'SALES_MANAGER'];
  if (!allowedRoles.includes(context.role)) {
    throw createAuthError(
      403,
      'FORBIDDEN',
      `You do not have permission to ${action} this order. Operations or managerial role required.`
    );
  }

  return true;
}

/**
 * Validates support ticket resolution, closure, and reopening.
 * Only the assigned support agent, case creator, or sales manager/super admin can transition ticket state.
 */
export function assertCanModifyCase(
  context: AuthContext,
  supportCase: {
    organizationId: string;
    assignedToId?: string | null;
    createdById?: string | null;
  },
  action = 'modify'
): boolean {
  if (supportCase.organizationId !== context.organizationId) {
    throw createAuthError(
      404,
      'NOT_FOUND',
      'Support case was not found in your organization.'
    );
  }

  // If unassigned, allow any authenticated member to assign or claim
  if (!supportCase.assignedToId && (action === 'assign' || action === 'claim')) {
    return true;
  }

  return assertResourceOwnership(context, supportCase, {
    domain: 'support',
    allowAssignee: true,
    allowCreator: true,
    actionDescription: `You do not have permission to ${action} this support case because it is assigned to another agent.`
  });
}
