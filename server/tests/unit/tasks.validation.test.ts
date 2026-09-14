import { describe, it, expect } from 'vitest';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  getTasksQuerySchema
} from '../../src/modules/tasks/tasks.validation.js';

describe('Task Validation Schemas (unit)', () => {
  const validUUID = '22222222-2222-2222-2222-222222222222';

  it('should accept valid createTask input', () => {
    const valid = {
      title: 'Send Revised MSA and SOW',
      description: 'Review legal terms with general counsel.',
      dueDate: '2026-09-20T17:00:00.000Z',
      priority: 'HIGH',
      status: 'TODO',
      accountId: validUUID,
      assignedToId: validUUID
    };

    const parsed = createTaskSchema.parse(valid);
    expect(parsed.title).toBe('Send Revised MSA and SOW');
    expect(parsed.priority).toBe('HIGH');
    expect(parsed.status).toBe('TODO');
  });

  it('should use default status TODO and priority MEDIUM when omitted', () => {
    const valid = {
      title: 'Quick follow-up call'
    };

    const parsed = createTaskSchema.parse(valid);
    expect(parsed.title).toBe('Quick follow-up call');
    expect(parsed.status).toBe('TODO');
    expect(parsed.priority).toBe('MEDIUM');
  });

  it('should reject invalid priority or status', () => {
    const invalidPriority = {
      title: 'Urgent Task',
      priority: 'SUPER_URGENT'
    };
    expect(() => createTaskSchema.parse(invalidPriority)).toThrow();

    const invalidStatus = {
      title: 'Done Task',
      status: 'FINISHED'
    };
    expect(() => createTaskSchema.parse(invalidStatus)).toThrow();
  });

  it('should reject empty title', () => {
    const invalid = {
      title: '   '
    };
    expect(() => createTaskSchema.parse(invalid)).toThrow();
  });

  it('should validate updateTaskStatusSchema', () => {
    const valid = updateTaskStatusSchema.parse({ status: 'COMPLETED' });
    expect(valid.status).toBe('COMPLETED');

    expect(() => updateTaskStatusSchema.parse({ status: 'UNKNOWN' })).toThrow();
  });

  it('should validate assignTaskSchema allowing null assignedToId (unassigning)', () => {
    const assigned = assignTaskSchema.parse({ assignedToId: validUUID });
    expect(assigned.assignedToId).toBe(validUUID);

    const unassigned = assignTaskSchema.parse({ assignedToId: null });
    expect(unassigned.assignedToId).toBeNull();
  });

  it('should parse getTasksQuerySchema with default pagination and filter parameters', () => {
    const query = getTasksQuerySchema.parse({ status: 'TODO', priority: 'HIGH' });
    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
    expect(query.status).toBe('TODO');
    expect(query.priority).toBe('HIGH');
  });
});
