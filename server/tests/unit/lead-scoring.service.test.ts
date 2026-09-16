import { describe, it, expect } from 'vitest';
import { leadScoringService, LeadScoringRawData } from '../../src/modules/leads/lead-scoring.service.js';
import { ActivityType, OpportunityStatus, LeadStatus } from '@prisma/client';

describe('LeadScoringService — Factor & Model Tests', () => {
  const baseDate = new Date('2026-09-16T12:00:00Z');

  const createBaseLeadData = (overrides?: Partial<LeadScoringRawData['lead']>): LeadScoringRawData => ({
    lead: {
      id: 'lead-1',
      organizationId: 'org-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@acme.com',
      phone: '+1 555 123 4567',
      company: 'Acme Corp',
      jobTitle: 'VP of Engineering',
      source: 'WEBSITE',
      status: LeadStatus.NEW,
      notes: 'Strong qualification signals and immediate budget.',
      ownerId: 'user-1',
      createdAt: new Date('2026-09-01T12:00:00Z'),
      updatedAt: new Date('2026-09-01T12:00:00Z'),
      ...overrides
    },
    activities: [],
    completedTasks: [],
    opportunities: []
  });

  // ==========================================
  // 1. LEAD FIT TESTS (Max 25 pts)
  // ==========================================
  describe('Lead Fit (Max 25)', () => {
    it('should award 0 points when lead is empty or has only placeholder values', () => {
      const data = createBaseLeadData({
        company: 'N/A',
        jobTitle: '-',
        source: 'none',
        ownerId: null,
        notes: ''
      });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.fit).toBe(0);
    });

    it('should award full 25 points when all qualification attributes exist', () => {
      const data = createBaseLeadData({
        company: 'Acme Corp',
        jobTitle: 'Director',
        source: 'ORGANIC_SEARCH',
        ownerId: 'user-1',
        notes: 'Pre-qualified enterprise lead with 250+ employees'
      });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.fit).toBe(25);
    });

    it('should award partial points for partial qualification attributes', () => {
      const data = createBaseLeadData({
        company: 'Acme Corp', // +5
        jobTitle: null,       // 0
        source: 'REFERRAL',   // +5
        ownerId: null,        // 0
        notes: null           // 0
      });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.fit).toBe(10);
    });
  });

  // ==========================================
  // 2. CONTACT QUALITY TESTS (Max 15 pts)
  // ==========================================
  describe('Contact Quality (Max 15)', () => {
    it('should evaluate full 15 points for valid email, phone, full name, and company', () => {
      const data = createBaseLeadData({
        email: 'john.doe@enterprise.org', // +5
        phone: '1234567890',              // +4
        firstName: 'John',                // +3 (with lastName)
        lastName: 'Doe',
        company: 'Enterprise Org'         // +3
      });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.contactQuality).toBe(15);
    });

    it('should reject placeholder phones and invalid emails from contact quality points', () => {
      const data = createBaseLeadData({
        email: 'not-an-email',
        phone: '0000000',
        firstName: 'J', // too short (<2)
        lastName: 'D',
        company: 'N/A'
      });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.contactQuality).toBe(0);
      expect(result.breakdown.negativeSignals).toBe(5); // Malformed email penalty
    });

    it('should handle missing phone gracefully without penalty', () => {
      const data = createBaseLeadData({
        email: 'valid.email@example.com',
        phone: null,
        firstName: 'Alice',
        lastName: 'Smith',
        company: 'Example Co'
      });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.contactQuality).toBe(11); // 5 (email) + 3 (name) + 3 (company)
    });
  });

  // ==========================================
  // 3. ENGAGEMENT TESTS (Max 25 pts)
  // ==========================================
  describe('Engagement (Max 25)', () => {
    it('should evaluate 0 when no activities exist', () => {
      const data = createBaseLeadData();
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.engagement).toBe(0);
    });

    it('should calculate weighted sum for note, email, call, meeting', () => {
      const data = createBaseLeadData();
      data.activities = [
        { id: '1', type: ActivityType.NOTE, activityDate: baseDate },    // +1
        { id: '2', type: ActivityType.EMAIL, activityDate: baseDate },   // +3
        { id: '3', type: ActivityType.CALL, activityDate: baseDate },    // +4
        { id: '4', type: ActivityType.MEETING, activityDate: baseDate }  // +6
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.engagement).toBe(14); // 1 + 3 + 4 + 6 = 14
    });

    it('should cap cumulative engagement at 25 points maximum', () => {
      const data = createBaseLeadData();
      data.activities = [
        { id: '1', type: ActivityType.MEETING, activityDate: baseDate }, // 6
        { id: '2', type: ActivityType.MEETING, activityDate: baseDate }, // 6
        { id: '3', type: ActivityType.MEETING, activityDate: baseDate }, // 6
        { id: '4', type: ActivityType.MEETING, activityDate: baseDate }, // 6
        { id: '5', type: ActivityType.CALL, activityDate: baseDate },    // 4
        { id: '6', type: ActivityType.CALL, activityDate: baseDate }     // 4
      ]; // total 32
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.engagement).toBe(25);
    });

    it('should include completed tasks in engagement calculation', () => {
      const data = createBaseLeadData();
      data.activities = [
        { id: '1', type: ActivityType.CALL, activityDate: baseDate } // +4
      ];
      data.completedTasks = [
        { id: 't-1', completedAt: baseDate } // +4
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.engagement).toBe(8);
    });
  });

  // ==========================================
  // 4. OPPORTUNITY SIGNAL TESTS (Max 20 pts)
  // ==========================================
  describe('Opportunity Signal (Max 20)', () => {
    it('should award 0 points when no opportunities are linked', () => {
      const data = createBaseLeadData();
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(0);
    });

    it('should award 8 points for created opportunity in initial stage', () => {
      const data = createBaseLeadData();
      data.opportunities = [
        { id: 'opp-1', status: OpportunityStatus.OPEN, probability: 0.1, stage: { name: 'Prospecting', probability: 0.1 } }
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(8);
    });

    it('should award 12 points for active progressing opportunity (probability >= 0.3)', () => {
      const data = createBaseLeadData();
      data.opportunities = [
        { id: 'opp-1', status: OpportunityStatus.OPEN, probability: 0.4, stage: { name: 'Discovery', probability: 0.4 } }
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(12);
    });

    it('should award 16 points for opportunity near closing (probability >= 0.7 or closing stage)', () => {
      const data = createBaseLeadData();
      data.opportunities = [
        { id: 'opp-1', status: OpportunityStatus.OPEN, probability: 0.75, stage: { name: 'Contract Negotiation', probability: 0.75 } }
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(16);
    });

    it('should award 20 points for WON opportunity', () => {
      const data = createBaseLeadData();
      data.opportunities = [
        { id: 'opp-1', status: OpportunityStatus.WON, probability: 1.0, stage: { name: 'Closed Won', probability: 1.0 } }
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(20);
    });

    it('should award 0 positive points for a LOST opportunity', () => {
      const data = createBaseLeadData();
      data.opportunities = [
        { id: 'opp-1', status: OpportunityStatus.LOST, probability: 0.0, stage: { name: 'Closed Lost', probability: 0.0 } }
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(0);
    });

    it('should select the strongest opportunity signal and not double-count multiple opportunities', () => {
      const data = createBaseLeadData();
      data.opportunities = [
        { id: 'opp-1', status: OpportunityStatus.LOST, probability: 0.0 },
        { id: 'opp-2', status: OpportunityStatus.OPEN, probability: 0.2 }, // 8
        { id: 'opp-3', status: OpportunityStatus.OPEN, probability: 0.8 }  // 16
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(16);
    });
  });

  // ==========================================
  // 5. RECENCY TESTS (Max 15 pts)
  // ==========================================
  describe('Recency (Max 15)', () => {
    it('should award 15 points for activity within 1 day', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.NOTE, activityDate: new Date('2026-09-16T08:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(15);
    });

    it('should award 13 points for activity within 3 days', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.NOTE, activityDate: new Date('2026-09-14T08:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(13);
    });

    it('should award 11 points for activity within 7 days', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.NOTE, activityDate: new Date('2026-09-10T12:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(11);
    });

    it('should award 8 points for activity within 14 days', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.NOTE, activityDate: new Date('2026-09-04T12:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(8);
    });

    it('should award 5 points for activity within 30 days', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.NOTE, activityDate: new Date('2026-08-25T12:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(5);
    });

    it('should award 2 points for activity within 90 days', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.NOTE, activityDate: new Date('2026-07-01T12:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(2);
    });

    it('should award 0 points for activity older than 90 days or no activity', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.NOTE, activityDate: new Date('2025-01-01T12:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(0);
    });

    it('should safely handle future-dated activity without crashing or exceeding 15 pts', () => {
      const data = createBaseLeadData();
      data.activities = [{ id: '1', type: ActivityType.MEETING, activityDate: new Date('2026-10-01T12:00:00Z') }];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.recency).toBe(15);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================
  // 6. NEGATIVE SIGNALS & STATUS
  // ==========================================
  describe('Negative Signals & Penalties', () => {
    it('should apply -20 penalty and cancel opportunity points when lead is marked LOST', () => {
      const data = createBaseLeadData({ status: LeadStatus.LOST });
      data.opportunities = [
        { id: 'opp-1', status: OpportunityStatus.WON, probability: 1.0 }
      ];
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.opportunity).toBe(0);
      expect(result.breakdown.negativeSignals).toBe(20);
    });

    it('should penalize malformed email by 5 points', () => {
      const data = createBaseLeadData({ email: 'bad-email-format' });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.breakdown.negativeSignals).toBe(5);
    });

    it('should clamp total score to 0 and never return negative score', () => {
      const data = createBaseLeadData({
        status: LeadStatus.LOST,
        email: 'invalid-email',
        company: null,
        jobTitle: null,
        source: null,
        ownerId: null,
        notes: null
      });
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.score).toBe(0);
      expect(result.category).toBe('COLD');
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================
  // 7. BOUNDARIES & CATEGORIES
  // ==========================================
  describe('Score Boundaries & Category Classifications', () => {
    it('should correctly classify exact threshold boundaries', () => {
      expect(leadScoringService.getLeadScoreCategory(0)).toBe('COLD');
      expect(leadScoringService.getLeadScoreCategory(29)).toBe('COLD');
      expect(leadScoringService.getLeadScoreCategory(30)).toBe('COOL');
      expect(leadScoringService.getLeadScoreCategory(59)).toBe('COOL');
      expect(leadScoringService.getLeadScoreCategory(60)).toBe('WARM');
      expect(leadScoringService.getLeadScoreCategory(79)).toBe('WARM');
      expect(leadScoringService.getLeadScoreCategory(80)).toBe('HOT');
      expect(leadScoringService.getLeadScoreCategory(100)).toBe('HOT');
    });

    it('should handle edge cases like NaN, Infinity safely with COLD fallback', () => {
      expect(leadScoringService.getLeadScoreCategory(NaN)).toBe('COLD');
      expect(leadScoringService.getLeadScoreCategory(Infinity)).toBe('COLD');
      expect(leadScoringService.getLeadScoreCategory(-10)).toBe('COLD');
    });

    it('should achieve 100 for a fully loaded, high-engagement, won opportunity lead', () => {
      const data = createBaseLeadData();
      data.activities = [
        { id: '1', type: ActivityType.MEETING, activityDate: baseDate },
        { id: '2', type: ActivityType.MEETING, activityDate: baseDate },
        { id: '3', type: ActivityType.CALL, activityDate: baseDate },
        { id: '4', type: ActivityType.CALL, activityDate: baseDate },
        { id: '5', type: ActivityType.EMAIL, activityDate: baseDate }
      ]; // 6 + 6 + 4 + 4 + 3 = 23 + notes/tasks -> 25
      data.completedTasks = [{ id: 't1', completedAt: baseDate }]; // +4 => 25 capped
      data.opportunities = [{ id: 'o1', status: OpportunityStatus.WON, probability: 1.0 }]; // 20
      // Fit: 25, Contact Quality: 15, Engagement: 25, Opp: 20, Recency: 15 => 100
      const result = leadScoringService.evaluateLeadScore(data, baseDate);
      expect(result.score).toBe(100);
      expect(result.category).toBe('HOT');
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});
