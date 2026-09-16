import { describe, it, expect } from 'vitest';
import { leadScoringService, LeadScoringRawData } from '../../src/modules/leads/lead-scoring.service.js';
import { ActivityType, OpportunityStatus, LeadStatus } from '@prisma/client';
import { createLeadSchema, updateLeadSchema } from '../../src/modules/leads/leads.validation.js';

describe('Lead Scoring Engine — Dynamic Recalculation & Mutation Reactions', () => {
  const baseDate = new Date('2026-09-16T12:00:00Z');

  const createInitialLead = (): LeadScoringRawData => ({
    lead: {
      id: 'lead-test-1',
      organizationId: 'org-test-1',
      firstName: 'Michael',
      lastName: 'Scott',
      email: 'mscott@dundermifflin.com',
      phone: '5705551234',
      company: 'Dunder Mifflin',
      jobTitle: 'Regional Manager',
      source: 'DIRECT_OUTREACH',
      status: LeadStatus.NEW,
      notes: 'Initial outreach made.',
      ownerId: 'user-sales-1',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T10:00:00Z')
    },
    activities: [],
    completedTasks: [],
    opportunities: []
  });

  it('1. Initial Lead Creation: calculates baseline score from fit & contact quality', () => {
    const data = createInitialLead();
    const initialResult = leadScoringService.evaluateLeadScore(data, baseDate);

    // Fit: company(5) + jobTitle(5) + source(5) + ownerId(5) + notes(5) = 25
    // Contact: email(5) + phone(4) + name(3) + company(3) = 15
    // Engagement: 0
    // Opp: 0
    // Recency: 0
    expect(initialResult.score).toBe(40);
    expect(initialResult.category).toBe('COOL');
  });

  it('2. Activity Addition: adding calls and meetings increases engagement and recency', () => {
    const data = createInitialLead();
    const beforeResult = leadScoringService.evaluateLeadScore(data, baseDate);

    // Add a call 2 days ago
    data.activities.push({
      id: 'act-1',
      type: ActivityType.CALL,
      activityDate: new Date('2026-09-14T10:00:00Z')
    });

    const afterCallResult = leadScoringService.evaluateLeadScore(data, baseDate);
    // Engagement: +4 (Call)
    // Recency: +13 (Within 3 days)
    expect(afterCallResult.score).toBe(beforeResult.score + 4 + 13);
    expect(afterCallResult.score).toBe(57);
    expect(afterCallResult.category).toBe('COOL');

    // Add a meeting today
    data.activities.push({
      id: 'act-2',
      type: ActivityType.MEETING,
      activityDate: new Date('2026-09-16T10:00:00Z')
    });

    const afterMeetingResult = leadScoringService.evaluateLeadScore(data, baseDate);
    // Engagement: +4 + 6 = 10
    // Recency: updated to 15 (within 1 day)
    expect(afterMeetingResult.score).toBe(40 + 10 + 15);
    expect(afterMeetingResult.score).toBe(65);
    expect(afterMeetingResult.category).toBe('WARM');
  });

  it('3. Activity Deletion: removing an activity drops engagement and updates recency', () => {
    const data = createInitialLead();
    data.activities = [
      { id: 'act-1', type: ActivityType.CALL, activityDate: new Date('2026-08-01T10:00:00Z') },
      { id: 'act-2', type: ActivityType.MEETING, activityDate: new Date('2026-09-16T10:00:00Z') }
    ];

    const withBoth = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(withBoth.breakdown.engagement).toBe(10); // 4 + 6
    expect(withBoth.breakdown.recency).toBe(15); // latest is today

    // Delete the recent meeting
    data.activities = [data.activities[0]];

    const afterDelete = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(afterDelete.breakdown.engagement).toBe(4); // only call left
    // Aug 1 is >45 days ago -> <= 90 days => 2 pts
    expect(afterDelete.breakdown.recency).toBe(2);
    expect(afterDelete.score).toBeLessThan(withBoth.score);
  });

  it('4. Opportunity Lifecycle Transitions: creation -> progressing -> won -> lost', () => {
    const data = createInitialLead();

    // Stage 1: Created
    data.opportunities.push({
      id: 'opp-1',
      status: OpportunityStatus.OPEN,
      probability: 0.1,
      stage: { name: 'Initial Qualification', probability: 0.1 }
    });
    let result = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(result.breakdown.opportunity).toBe(8);

    // Stage 2: Progressing to proposal
    data.opportunities[0].probability = 0.5;
    data.opportunities[0].stage = { name: 'Proposal Sent', probability: 0.5 };
    result = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(result.breakdown.opportunity).toBe(16); // 'proposal' keyword

    // Stage 3: Won Deal
    data.opportunities[0].status = OpportunityStatus.WON;
    data.opportunities[0].probability = 1.0;
    data.opportunities[0].stage = { name: 'Closed Won', probability: 1.0 };
    result = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(result.breakdown.opportunity).toBe(20);

    // Stage 4: Lost Deal
    data.opportunities[0].status = OpportunityStatus.LOST;
    data.opportunities[0].probability = 0.0;
    data.opportunities[0].stage = { name: 'Closed Lost', probability: 0.0 };
    result = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(result.breakdown.opportunity).toBe(0);
  });

  it('5. Lead Status Lost: triggers -20 deduction and zeroes opportunity points', () => {
    const data = createInitialLead();
    data.opportunities = [
      { id: 'opp-1', status: OpportunityStatus.OPEN, probability: 0.8 } // +16
    ];

    const openResult = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(openResult.breakdown.opportunity).toBe(16);
    expect(openResult.breakdown.negativeSignals).toBe(0);

    // Transition lead to LOST
    data.lead.status = LeadStatus.LOST;
    const lostResult = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(lostResult.breakdown.opportunity).toBe(0);
    expect(lostResult.breakdown.negativeSignals).toBe(20);
    expect(lostResult.score).toBeLessThan(openResult.score);
  });

  it('6. Lead Contact Information Update: updating email or phone recalculates quality', () => {
    const data = createInitialLead();
    data.lead.email = null;
    data.lead.phone = null;

    const noContactResult = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(noContactResult.breakdown.contactQuality).toBe(6); // name(3) + company(3)

    // User updates lead with valid email & phone
    data.lead.email = 'updated@dundermifflin.com';
    data.lead.phone = '1234567890';

    const updatedContactResult = leadScoringService.evaluateLeadScore(data, baseDate);
    expect(updatedContactResult.breakdown.contactQuality).toBe(15);
    expect(updatedContactResult.score).toBe(noContactResult.score + 9);
  });
});
