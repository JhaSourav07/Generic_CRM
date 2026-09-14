import { describe, it, expect } from 'vitest';
import {
  createPipelineSchema,
  updatePipelineSchema,
  createStageSchema,
  reorderStagesSchema
} from '../../src/modules/pipelines/pipelines.validation.js';

describe('Pipeline Validation Schemas (unit)', () => {
  const validUUID = '11111111-1111-1111-1111-111111111111';

  it('should validate createPipelineSchema with valid input', () => {
    const valid = {
      name: 'Direct Sales Pipeline',
      description: 'Outbound sales workflow',
      isDefault: true
    };

    const parsed = createPipelineSchema.parse(valid);
    expect(parsed.name).toBe('Direct Sales Pipeline');
    expect(parsed.isDefault).toBe(true);
  });

  it('should reject createPipelineSchema with empty name', () => {
    expect(() => createPipelineSchema.parse({ name: '' })).toThrow();
  });

  it('should validate createStageSchema', () => {
    const stage = {
      name: 'Product Demo',
      order: 2,
      probability: 0.35
    };

    const parsed = createStageSchema.parse(stage);
    expect(parsed.name).toBe('Product Demo');
    expect(parsed.order).toBe(2);
    expect(parsed.probability).toBe(0.35);
  });

  it('should reject createStageSchema with invalid probability > 1', () => {
    expect(() => createStageSchema.parse({ name: 'Stage', probability: 1.5 })).toThrow();
  });

  it('should validate reorderStagesSchema', () => {
    const valid = {
      stages: [
        { id: validUUID, order: 1 }
      ]
    };

    const parsed = reorderStagesSchema.parse(valid);
    expect(parsed.stages.length).toBe(1);
    expect(parsed.stages[0].order).toBe(1);
  });
});
