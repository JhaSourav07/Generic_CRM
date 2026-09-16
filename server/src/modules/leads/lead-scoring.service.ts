import { Prisma, ActivityType, OpportunityStatus, LeadStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export type LeadScoreCategory = 'COLD' | 'COOL' | 'WARM' | 'HOT';

export interface LeadScoreBreakdownDetails {
  fit: number;
  fitMax: number;
  contactQuality: number;
  contactQualityMax: number;
  engagement: number;
  engagementMax: number;
  opportunity: number;
  opportunityMax: number;
  recency: number;
  recencyMax: number;
  negativeSignals: number;
}

export interface LeadScoreResult {
  score: number;
  category: LeadScoreCategory;
  breakdown: LeadScoreBreakdownDetails;
  reasons: string[];
}

export interface LeadScoringRawData {
  lead: {
    id: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    source?: string | null;
    status: LeadStatus;
    notes?: string | null;
    ownerId?: string | null;
    convertedAccountId?: string | null;
    convertedContactId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  activities: Array<{
    id: string;
    type: ActivityType;
    activityDate: Date;
  }>;
  completedTasks: Array<{
    id: string;
    completedAt?: Date | null;
  }>;
  opportunities: Array<{
    id: string;
    status: OpportunityStatus;
    probability: number;
    stage?: {
      name?: string;
      probability?: number;
    } | null;
  }>;
}

const PLACEHOLDER_STRINGS = new Set([
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  'test',
  'placeholder',
  '-',
  '--',
  'unknown'
]);

function isMeaningfulText(val?: string | null, minLen = 2): boolean {
  if (!val) return false;
  const trimmed = val.trim().toLowerCase();
  if (trimmed.length < minLen) return false;
  return !PLACEHOLDER_STRINGS.has(trimmed);
}

function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  if (!trimmed || PLACEHOLDER_STRINGS.has(trimmed.toLowerCase())) return false;
  // RFC 5322 compatible standard email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

function isValidPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!trimmed || PLACEHOLDER_STRINGS.has(trimmed.toLowerCase())) return false;
  const digits = trimmed.replace(/\D/g, '');
  // At least 7 digits, not repeating identical digits (e.g. 0000000)
  if (digits.length < 7) return false;
  const allSame = digits.split('').every((d) => d === digits[0]);
  return !allSame;
}

export class LeadScoringService {
  /**
   * Deterministic categorization of score into COLD, COOL, WARM, HOT.
   */
  public getLeadScoreCategory(score: number): LeadScoreCategory {
    if (isNaN(score) || !isFinite(score) || score < 30) return 'COLD';
    if (score < 60) return 'COOL';
    if (score < 80) return 'WARM';
    return 'HOT';
  }

  /**
   * Pure deterministic calculation logic operating on in-memory CRM data.
   * Can be tested independently without requiring a database connection.
   */
  public evaluateLeadScore(data: LeadScoringRawData, referenceDate: Date = new Date()): LeadScoreResult {
    const { lead, activities, completedTasks, opportunities } = data;
    const reasons: string[] = [];

    // ==========================================
    // 1. LEAD FIT (Max 25 pts)
    // ==========================================
    let fit = 0;
    if (isMeaningfulText(lead.company)) {
      fit += 5;
      reasons.push('Company information provided (+5)');
    }
    if (isMeaningfulText(lead.jobTitle)) {
      fit += 5;
      reasons.push('Job title provided (+5)');
    }
    if (isMeaningfulText(lead.source)) {
      fit += 5;
      reasons.push('Lead acquisition source identified (+5)');
    }
    if (lead.ownerId) {
      fit += 5;
      reasons.push('Sales representative assigned (+5)');
    }
    if (isMeaningfulText(lead.notes, 5)) {
      fit += 5;
      reasons.push('Qualification notes entered (+5)');
    }
    fit = Math.max(0, Math.min(25, fit));

    // ==========================================
    // 2. CONTACT QUALITY (Max 15 pts)
    // ==========================================
    let contactQuality = 0;
    const hasEmail = Boolean(lead.email && lead.email.trim() !== '');
    const emailValid = isValidEmail(lead.email);

    if (emailValid) {
      contactQuality += 5;
      reasons.push('Valid business email address verified (+5)');
    }

    if (isValidPhone(lead.phone)) {
      contactQuality += 4;
      reasons.push('Valid direct telephone number provided (+4)');
    }

    if (isMeaningfulText(lead.firstName) && isMeaningfulText(lead.lastName)) {
      contactQuality += 3;
      reasons.push('Complete contact name provided (+3)');
    }

    if (isMeaningfulText(lead.company)) {
      contactQuality += 3;
      reasons.push('Corporate entity associated (+3)');
    }
    contactQuality = Math.max(0, Math.min(15, contactQuality));

    // ==========================================
    // 3. ENGAGEMENT (Max 25 pts)
    // ==========================================
    let engagement = 0;
    let callCount = 0;
    let meetingCount = 0;
    let emailCount = 0;
    let noteCount = 0;
    let otherCount = 0;

    for (const act of activities) {
      switch (act.type) {
        case ActivityType.CALL:
          engagement += 4;
          callCount++;
          break;
        case ActivityType.MEETING:
          engagement += 6;
          meetingCount++;
          break;
        case ActivityType.EMAIL:
          engagement += 3;
          emailCount++;
          break;
        case ActivityType.NOTE:
          engagement += 1;
          noteCount++;
          break;
        case ActivityType.OTHER:
          engagement += 2;
          otherCount++;
          break;
      }
    }

    const taskCount = completedTasks.length;
    if (taskCount > 0) {
      engagement += taskCount * 4;
    }

    if (callCount > 0) reasons.push(`Logged phone calls (${callCount})`);
    if (meetingCount > 0) reasons.push(`Conducted sales meetings (${meetingCount})`);
    if (emailCount > 0) reasons.push(`Email interactions (${emailCount})`);
    if (noteCount > 0) reasons.push(`Interaction notes recorded (${noteCount})`);
    if (taskCount > 0) reasons.push(`Completed follow-up tasks (${taskCount})`);

    engagement = Math.max(0, Math.min(25, engagement));

    // ==========================================
    // 4. OPPORTUNITY SIGNAL (Max 20 pts)
    // ==========================================
    let opportunityScore = 0;
    const isLostLead = lead.status === LeadStatus.LOST;

    if (isLostLead) {
      opportunityScore = 0;
    } else if (opportunities.length > 0) {
      let maxSignal = 0;

      for (const opp of opportunities) {
        let signal = 0;
        if (opp.status === OpportunityStatus.WON) {
          signal = 20;
        } else if (opp.status === OpportunityStatus.OPEN) {
          const prob = opp.probability || opp.stage?.probability || 0;
          const stageName = (opp.stage?.name || '').toLowerCase();

          if (prob >= 0.7 || stageName.includes('closing') || stageName.includes('proposal') || stageName.includes('negotiat')) {
            signal = 16;
          } else if (prob >= 0.3) {
            signal = 12;
          } else {
            signal = 8;
          }
        }
        if (signal > maxSignal) {
          maxSignal = signal;
        }
      }

      opportunityScore = Math.max(0, Math.min(20, maxSignal));
      if (opportunityScore === 20) reasons.push('Won commercial opportunity associated (+20)');
      else if (opportunityScore === 16) reasons.push('Opportunity in closing or late negotiation stage (+16)');
      else if (opportunityScore === 12) reasons.push('Active progressing opportunity (+12)');
      else if (opportunityScore === 8) reasons.push('Opportunity created in initial stage (+8)');
    }

    // ==========================================
    // 5. RECENCY (Max 15 pts)
    // ==========================================
    let recency = 0;
    if (activities.length > 0) {
      // Find the most recent activity timestamp
      let latestTime = 0;
      for (const act of activities) {
        const d = new Date(act.activityDate).getTime();
        if (d > latestTime) latestTime = d;
      }

      const nowTime = referenceDate.getTime();
      // Handle future-dated timestamps safely: if future date, treat as 0 days elapsed
      const diffMs = Math.max(0, nowTime - latestTime);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        recency = 15;
        reasons.push('Activity recorded within the last 24 hours (+15)');
      } else if (diffDays <= 3) {
        recency = 13;
        reasons.push('Activity recorded within the last 3 days (+13)');
      } else if (diffDays <= 7) {
        recency = 11;
        reasons.push('Activity recorded within the last 7 days (+11)');
      } else if (diffDays <= 14) {
        recency = 8;
        reasons.push('Activity recorded within the last 14 days (+8)');
      } else if (diffDays <= 30) {
        recency = 5;
        reasons.push('Activity recorded within the last 30 days (+5)');
      } else if (diffDays <= 90) {
        recency = 2;
        reasons.push('Activity recorded within the last 90 days (+2)');
      } else {
        recency = 0;
        reasons.push('No recent activity recorded (>90 days)');
      }
    } else {
      recency = 0;
    }

    // ==========================================
    // 6. NEGATIVE SIGNALS & PENALTIES
    // ==========================================
    let negativeSignals = 0;

    // Penalize malformed email if provided
    if (hasEmail && !emailValid) {
      negativeSignals += 5;
      reasons.push('Malformed or invalid email address (-5)');
    }

    // Penalize lead marked LOST
    if (isLostLead) {
      negativeSignals += 20;
      reasons.push('Lead marked as lost (-20)');
    }

    // Final Clamped Score Calculation
    const totalRaw = fit + contactQuality + engagement + opportunityScore + recency - negativeSignals;
    const finalScore = Math.max(0, Math.min(100, Math.round(totalRaw)));
    const category = this.getLeadScoreCategory(finalScore);

    return {
      score: finalScore,
      category,
      breakdown: {
        fit,
        fitMax: 25,
        contactQuality,
        contactQualityMax: 15,
        engagement,
        engagementMax: 25,
        opportunity: opportunityScore,
        opportunityMax: 20,
        recency,
        recencyMax: 15,
        negativeSignals
      },
      reasons
    };
  }

  /**
   * Fetch complete lead data within tenant boundary and calculate score.
   */
  public async calculateLeadScore(
    organizationId: string,
    leadId: string,
    txClient?: Prisma.TransactionClient
  ): Promise<LeadScoreResult> {
    const db = txClient || prisma;

    const lead = await db.lead.findFirst({
      where: {
        id: leadId,
        organizationId,
        deletedAt: null
      },
      include: {
        activities: {
          select: {
            id: true,
            type: true,
            activityDate: true
          }
        },
        tasks: {
          where: {
            status: 'COMPLETED',
            deletedAt: null
          },
          select: {
            id: true,
            completedAt: true
          }
        }
      }
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} not found in organization ${organizationId}`);
    }

    // Find linked opportunities:
    // 1. Directly linked via opportunity.leadId = lead.id
    // 2. Or if converted, via accountId = lead.convertedAccountId OR contactId = lead.convertedContactId
    const oppWhere: Prisma.OpportunityWhereInput = {
      organizationId,
      deletedAt: null,
      OR: [
        { leadId: lead.id },
        ...(lead.convertedAccountId ? [{ accountId: lead.convertedAccountId }] : []),
        ...(lead.convertedContactId ? [{ contactId: lead.convertedContactId }] : [])
      ]
    };

    const opportunities = await db.opportunity.findMany({
      where: oppWhere,
      select: {
        id: true,
        status: true,
        probability: true,
        stage: {
          select: {
            name: true,
            probability: true
          }
        }
      }
    });

    return this.evaluateLeadScore({
      lead,
      activities: lead.activities,
      completedTasks: lead.tasks,
      opportunities
    });
  }

  /**
   * Calculate and persist the score on the Lead record.
   */
  public async calculateAndPersistLeadScore(
    organizationId: string,
    leadId: string,
    txClient?: Prisma.TransactionClient
  ): Promise<LeadScoreResult> {
    const db = txClient || prisma;

    const result = await this.calculateLeadScore(organizationId, leadId, db);

    await db.lead.update({
      where: { id: leadId },
      data: {
        score: result.score,
        scoreCategory: result.category,
        scoreUpdatedAt: new Date(),
        scoreAlgorithmVersion: 'v1'
      }
    });

    return result;
  }

  /**
   * Recalculate lead scores for any leads linked to an Opportunity.
   */
  public async recalculateForOpportunity(
    organizationId: string,
    opportunity: {
      id: string;
      leadId?: string | null;
      accountId?: string | null;
      contactId?: string | null;
    },
    txClient?: Prisma.TransactionClient
  ): Promise<void> {
    const db = txClient || prisma;

    const leadIds = new Set<string>();
    if (opportunity.leadId) {
      leadIds.add(opportunity.leadId);
    }

    if (opportunity.accountId || opportunity.contactId) {
      const convertedLeads = await db.lead.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [
            ...(opportunity.accountId ? [{ convertedAccountId: opportunity.accountId }] : []),
            ...(opportunity.contactId ? [{ convertedContactId: opportunity.contactId }] : [])
          ]
        },
        select: { id: true }
      });
      for (const l of convertedLeads) {
        leadIds.add(l.id);
      }
    }

    for (const id of leadIds) {
      await this.calculateAndPersistLeadScore(organizationId, id, db);
    }
  }

  /**
   * Idempotent, organization-safe batch backfill of all lead scores.
   */
  public async backfillAllLeads(organizationId?: string, batchSize = 100): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;
    let cursor: string | undefined = undefined;

    const baseWhere: Prisma.LeadWhereInput = {
      deletedAt: null,
      ...(organizationId ? { organizationId } : {})
    };

    while (true) {
      const leads: Array<{ id: string; organizationId: string }> = await prisma.lead.findMany({
        where: baseWhere,
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
        select: { id: true, organizationId: true }
      });

      if (leads.length === 0) break;

      for (const lead of leads) {
        try {
          await this.calculateAndPersistLeadScore(lead.organizationId, lead.id);
          processed++;
        } catch (err) {
          errors++;
          console.error(`Error scoring lead ${lead.id}:`, err);
        }
      }

      cursor = leads[leads.length - 1].id;
      if (leads.length < batchSize) break;
    }

    return { processed, errors };
  }
}

export const leadScoringService = new LeadScoringService();
