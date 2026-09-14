import { describe, it, expect } from 'vitest';
import {
  createActivitySchema,
  updateActivitySchema,
  getActivitiesQuerySchema
} from '../../src/modules/activities/activities.validation.js';

describe('Activity Validation Schemas (unit)', () => {
  const validUUID = '11111111-1111-1111-1111-111111111111';

  it('should accept valid createActivity input', () => {
    const valid = {
      type: 'CALL',
      subject: 'Quarterly review call',
      description: 'Discussed renewal terms and expanding user seats.',
      activityDate: '2026-09-14T10:00:00.000Z',
      accountId: validUUID
    };

    const parsed = createActivitySchema.parse(valid);
    expect(parsed.type).toBe('CALL');
    expect(parsed.subject).toBe('Quarterly review call');
    expect(parsed.accountId).toBe(validUUID);
  });

  it('should reject invalid activity type', () => {
    const invalid = {
      type: 'INVALID_TYPE',
      subject: 'Invalid Activity'
    };

    expect(() => createActivitySchema.parse(invalid)).toThrow();
  });

  it('should reject missing or empty subject', () => {
    const missing = {
      type: 'NOTE',
      subject: '   '
    };

    expect(() => createActivitySchema.parse(missing)).toThrow();
  });

  it('should reject non-UUID entity references', () => {
    const invalid = {
      type: 'MEETING',
      subject: 'Sync Meeting',
      accountId: 'not-a-uuid'
    };

    expect(() => createActivitySchema.parse(invalid)).toThrow();
  });

  it('should validate query filters with sensible defaults', () => {
    const query = getActivitiesQuerySchema.parse({});
    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
    expect(query.sortBy).toBe('activityDate');
    expect(query.sortOrder).toBe('desc');
  });

  it('should validate updateActivitySchema allowing partial modifications', () => {
    const validUpdate = {
      subject: 'Updated Call Summary',
      description: 'Customer requested follow-up in 2 weeks.'
    };

    const parsed = updateActivitySchema.parse(validUpdate);
    expect(parsed.subject).toBe('Updated Call Summary');
    expect(parsed.type).toBeUndefined();
  });
});
