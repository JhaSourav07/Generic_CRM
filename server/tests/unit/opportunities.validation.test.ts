import { describe, it, expect } from 'vitest';
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  changeStageSchema,
  getOpportunitiesQuerySchema
} from '../../src/modules/opportunities/opportunities.validation.js';

describe('Opportunity Validation Schemas (unit)', () => {
  const validUUID = '11111111-1111-1111-1111-111111111111';

  it('should accept valid createOpportunity input', () => {
    const valid = {
      name: 'Valid Deal Name',
      pipelineId: validUUID,
      stageId: validUUID,
      value: 12500.50,
      probability: 0.5,
      expectedCloseDate: '2026-12-31T00:00:00.000Z'
    };

    const parsed = createOpportunitySchema.parse(valid);
    expect(parsed.name).toBe('Valid Deal Name');
    expect(parsed.value).toBe(12500.50);
    expect(parsed.probability).toBe(0.5);
  });

  it('should normalize percentage probability (e.g. 50% -> 0.5)', () => {
    const valid = {
      name: 'Percentage Probability Deal',
      pipelineId: validUUID,
      stageId: validUUID,
      probability: 75
    };

    const parsed = createOpportunitySchema.parse(valid);
    expect(parsed.probability).toBe(0.75);
  });

  it('should reject negative monetary value', () => {
    const invalid = {
      name: 'Negative Deal',
      pipelineId: validUUID,
      stageId: validUUID,
      value: -100
    };

    expect(() => createOpportunitySchema.parse(invalid)).toThrow();
  });

  it('should reject empty deal name', () => {
    const invalid = {
      name: '   ',
      pipelineId: validUUID,
      stageId: validUUID
    };

    expect(() => createOpportunitySchema.parse(invalid)).toThrow();
  });

  it('should validate query filters with default pagination', () => {
    const query = getOpportunitiesQuerySchema.parse({});
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.sortBy).toBe('createdAt');
    expect(query.sortOrder).toBe('desc');
  });

  it('should validate changeStageSchema requiring valid UUID', () => {
    expect(() => changeStageSchema.parse({ stageId: 'invalid-id' })).toThrow();
    const valid = changeStageSchema.parse({ stageId: validUUID });
    expect(valid.stageId).toBe(validUUID);
  });
});
