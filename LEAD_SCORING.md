# Vynexa CRM — Automatic Lead Scoring Engine (LEAD_SCORING.md)

This document provides the authoritative technical specification, mathematical formulation, event-driven recalculation architecture, database indexing strategy, and security model for the **Vynexa CRM Automatic Lead Scoring Engine**.

---

## 1. ARCHITECTURAL OVERVIEW & DESIGN PHILOSOPHY

The Vynexa CRM Lead Scoring Engine is a **production-grade, deterministic, explainable, server-controlled calculation engine**.

### 1.1 Core Principles
1. **Deterministic & Objective**: Given the exact same database state (lead properties, logged activities, linked opportunities, timestamps), the engine will always produce the exact same numerical score. No stochastic models, heuristics, or external black-box APIs.
2. **Server-Controlled & Tamper-Proof**: Scores and temperature categories are strictly computed on the backend (`server/src/modules/leads/lead-scoring.service.ts`). Client payloads attempting to forge or manipulate `score` or `scoreCategory` are rejected or overwritten by the server-side calculation pipeline.
3. **Explainable Breakdown**: Every score calculation yields an itemized audit trail detailing exactly which criteria contributed or deducted points. Sales representatives and managers can inspect the score via `GET /api/leads/:id/score` or the interactive UI dialog ("Why this score?").
4. **Multi-Tenant Boundary**: All calculations, activity lookups, and opportunity aggregations are strictly filtered by the authenticated session's `organizationId`. Cross-tenant data leakage is architecturally impossible.
5. **Zero AI / ML Buzzwords**: The engine is cleanly engineered around transparent enterprise business logic, avoiding pseudo-scientific probabilistic models.

---

## 2. MATHEMATICAL SCORING MODEL (0–100 CLAMPED)

The total score $S$ is clamped to the range $[0, 100]$ and computed across five core categories plus explicit negative deductions:

$$S = \text{clamp}\left(\text{Fit} + \text{Quality} + \text{Engagement} + \text{Opportunity} + \text{Recency} - \text{Penalties}, \, 0, \, 100\right)$$

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOTAL LEAD SCORE SPECTRUM (0 – 100)                                   │
├───────────────────┬───────────────────┬────────────────┬───────────────┤
│ Lead Fit (25 pts) │ Contact (15 pts)  │ Engag. (25 pts)│ Opp. (20 pts) │
├───────────────────┴───────────────────┴────────────────┴───────────────┤
│ Recency Decay Curve: max +15 pts                                      │
├────────────────────────────────────────────────────────────────────────┤
│ Negative Deductions: Status LOST (-20 pts), Malformed Email (-5 pts)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.1 Lead Fit (Maximum 25 Points)
Measures how well the lead matches the ideal customer profile (ICP):

| Criterion | Evaluation Condition | Points |
|---|---|---|
| **Company Identified** | `lead.company` is non-null, non-empty | **+5** |
| **Job Title Present** | `lead.jobTitle` is non-null, non-empty | **+5** |
| **Acquisition Source Recorded** | `lead.source` is non-null, non-empty | **+5** |
| **Assigned Representative** | `lead.ownerId` is assigned to an active tenant user | **+5** |
| **Qualification Notes Logged** | `lead.notes` length $\ge 15$ characters | **+5** |
| **Subtotal Maximum** | | **25 pts** |

---

### 2.2 Contact Data Quality (Maximum 15 Points)
Measures the completeness and reachability of the lead contact details:

| Criterion | Evaluation Condition | Points |
|---|---|---|
| **Valid Email Address** | RFC 5322 regex match (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) | **+5** |
| **Valid Phone Number** | Contains at least 7 digits (`lead.phone.replace(/\D/g, '').length >= 7`) | **+4** |
| **Complete Full Name** | Both `firstName` and `lastName` populated ($\ge 1$ char each) | **+3** |
| **Company Name Associated** | `lead.company` present (reinforces B2B context) | **+3** |
| **Malformed Email Penalty** | Email string provided but fails RFC 5322 syntax validation | **-5** |
| **Subtotal Maximum** | *(Clamped to [0, 15])* | **15 pts** |

---

### 2.3 Engagement Depth (Maximum 25 Points)
Measures logged sales touchpoints and activity history:

| Activity / Task Type | Weight per Occurrence | Capping Rules |
|---|---|---|
| **Meetings (`MEETING`)** | **+6 points** each | Evaluated across all activities linked to lead |
| **Calls (`CALL`)** | **+4 points** each | |
| **Emails (`EMAIL`)** | **+3 points** each | |
| **Completed Tasks (`TASK`)** | **+4 points** each | Evaluated for tasks with `status === 'COMPLETED'` |
| **Notes (`NOTE`)** | **+1 point** each | Internal logged notes |
| **Other Activities (`OTHER`)** | **+2 points** each | Demonstrations, site visits, webinars |
| **Subtotal Maximum** | *(Clamped to [0, 25])* | **25 pts** |

---

### 2.4 Commercial Opportunity Signal (Maximum 20 Points)
Measures high-intent commercial traction when opportunities are tied to the lead:

| Opportunity Stage / State | Signal Points |
|---|---|
| **Any Closed Won Opportunity (`CLOSED_WON`)** | **+20** |
| **Late-Stage Pipeline (`NEGOTIATION` or probability $\ge 80\%$)** | **+16** |
| **Active Pipeline (`PROPOSAL`, `QUALIFIED`, probability $40\%–79\%$)** | **+12** |
| **Early Stage (`NEW`, probability $< 40\%$)** | **+8** |
| **Closed Lost (`CLOSED_LOST`)** | **0** |
| **Lead Status `LOST` Override** | **0** *(Forces Opportunity Signal to 0 regardless of deals)* |
| **Subtotal Maximum** | *(Takes highest qualifying signal, max 20)* | **20 pts** |

---

### 2.5 Recency Decay Curve (Maximum 15 Points)
Reward active, timely interactions and naturally decay inactive leads. Based on the most recent interaction timestamp ($\max(\text{lastActivityAt}, \, \text{updatedAt}, \, \text{createdAt})$):

| Days Elapsed Since Last Interaction | Recency Points | Business Context |
|---|---|---|
| **$\le 1$ day** | **+15** | Immediate, hot engagement |
| **$2 – 3$ days** | **+13** | Active follow-up window |
| **$4 – 7$ days** | **+11** | Within current sales cycle week |
| **$8 – 14$ days** | **+8** | Follow-up due |
| **$15 – 30$ days** | **+5** | Cooling off |
| **$31 – 90$ days** | **+2** | Inactive / stagnant |
| **$> 90$ days** | **0** | Cold / unengaged |

*Note*: If a timestamp is in the future (e.g., clock skew), it is safely clamped to $\le 1$ day (+15 pts).

---

### 2.6 Negative Business Deductions
- **Status `LOST` Penalty**: **-20 points** deduction AND Opportunity Signal is overridden to **0**.
- **Malformed Email**: **-5 points** deduction applied against Contact Quality.
- **Inactivity**: Handled smoothly and monotonically via the 0-point floor of the Recency Decay Curve without punitive double-counting.

---

## 3. TEMPERATURE CATEGORIES

Every calculated score maps to a human-readable temperature category stored in `lead.scoreCategory`:

| Score Range | Category | Visual Badge (Charcoal Theme) | Recommended Action |
|---|---|---|---|
| **80 – 100** | `HOT` | `#EF4444` (Desaturated Coral/Crimson) | Immediate rep outreach; close pending opportunities; high priority. |
| **60 – 79** | `WARM` | `#F59E0B` (Desaturated Amber) | Active pipeline progression; schedule meeting or product demo. |
| **30 – 59** | `COOL` | `#3B82F6` (Desaturated Slate Blue) | Inbound nurture; follow-up sequence; gather missing contact data. |
| **0 – 29** | `COLD` | `#6F6F6F` (Desaturated Neutral) | Marketing drip; verify valid email/phone; re-engagement campaign. |

---

## 4. EVENT-DRIVEN RECALCULATION TRIGGERS

Scores are never stale. The engine recalculates and persists the score transactionally or immediately following any event that impacts score inputs:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EVENT TRIGGER MATRIX                           │
├────────────────────────┬───────────────────┬───────────────────────────┤
│ Mutation Event         │ Source Service    │ Recalculation Action      │
├────────────────────────┼───────────────────┼───────────────────────────┤
│ Lead Created           │ `leads.service`   │ Initial Score Persisted   │
│ Lead Updated           │ `leads.service`   │ Full Score Recalculation  │
│ Lead Assigned          │ `leads.service`   │ Full Score Recalculation  │
│ Lead Status Changed    │ `leads.service`   │ Full Score Recalculation  │
│ Lead Converted         │ `leads.service`   │ Full Score Recalculation  │
│ Activity Created       │ `activities.svc`  │ Lead Score Recalculation  │
│ Activity Updated       │ `activities.svc`  │ Lead Score Recalculation  │
│ Activity Deleted       │ `activities.svc`  │ Lead Score Recalculation  │
│ Opportunity Created    │ `opps.service`    │ Lead Score Recalculation  │
│ Opportunity Updated    │ `opps.service`    │ Lead Score Recalculation  │
│ Opportunity Stage Chg  │ `opps.service`    │ Lead Score Recalculation  │
│ Opportunity Won/Lost   │ `opps.service`    │ Lead Score Recalculation  │
│ Opportunity Deleted    │ `opps.service`    │ Lead Score Recalculation  │
└────────────────────────┴───────────────────┴───────────────────────────┘
```

---

## 5. PERSISTENCE & DATABASE INDEXING STRATEGY

### 5.1 Why Scores Are Persisted
Rather than computing scores dynamically on every paginated table query, Vynexa CRM stores the computed values directly in the `leads` table:
1. **Instant Sorting & Filtering**: Allows `ORDER BY score DESC` and `WHERE scoreCategory = 'HOT'` on millions of rows in sub-millisecond query time.
2. **Zero In-Memory Overhead**: Eliminates N+1 query loops on list views and executive dashboard rollups.
3. **Auditability**: Provides historical tracking via `scoreUpdatedAt` and `scoreAlgorithmVersion`.

### 5.2 Schema Fields (`Lead` Model)
```prisma
model Lead {
  // Existing fields...
  score                   Int       @default(0)
  scoreCategory           String?   // 'COLD' | 'COOL' | 'WARM' | 'HOT'
  scoreUpdatedAt          DateTime?
  scoreAlgorithmVersion   String?   @default("v1")

  // Indexes
  @@index([organizationId, score])
  @@index([organizationId, scoreCategory])
}

model Opportunity {
  // Linked Lead
  leadId          String?
  lead            Lead?    @relation(fields: [leadId], references: [id], onDelete: SetNull)

  // Index
  @@index([organizationId, leadId])
}
```

### 5.3 PostgreSQL Composite Indexes
- `@@index([organizationId, score])`: Optimizes sorted lead queries (`sortBy=score&sortOrder=desc`).
- `@@index([organizationId, scoreCategory])`: Optimizes category filter queries (`scoreCategory=HOT`).
- `@@index([organizationId, leadId])`: Optimizes opportunity lookups for lead scoring calculations.

---

## 6. EXPLAINABLE BREAKDOWN API

### Endpoint
`GET /api/leads/:id/score`

### Headers
```
Authorization: Bearer <token>
```

### Response Envelope
```json
{
  "success": true,
  "data": {
    "score": 84,
    "category": "HOT",
    "updatedAt": "2026-09-16T12:00:00.000Z",
    "algorithmVersion": "v1",
    "breakdown": {
      "fit": {
        "score": 25,
        "max": 25,
        "factors": [
          { "name": "Company Name", "points": 5, "max": 5, "matched": true, "reason": "Associated with Acme Technologies" },
          { "name": "Job Title", "points": 5, "max": 5, "matched": true, "reason": "Chief Technology Officer" },
          { "name": "Lead Source", "points": 5, "max": 5, "matched": true, "reason": "Acquisition source: Inbound Website" },
          { "name": "Assigned Owner", "points": 5, "max": 5, "matched": true, "reason": "Assigned to team representative" },
          { "name": "Qualification Notes", "points": 5, "max": 5, "matched": true, "reason": "Detailed qualification notes recorded" }
        ]
      },
      "contactQuality": {
        "score": 15,
        "max": 15,
        "factors": [
          { "name": "Valid Email Address", "points": 5, "max": 5, "matched": true, "reason": "RFC-compliant email: cto@acme.com" },
          { "name": "Phone Number", "points": 4, "max": 4, "matched": true, "reason": "Direct phone number provided" },
          { "name": "Full Name", "points": 3, "max": 3, "matched": true, "reason": "First and last name present" },
          { "name": "Company Affiliation", "points": 3, "max": 3, "matched": true, "reason": "Organization name attached" }
        ]
      },
      "engagement": {
        "score": 19,
        "max": 25,
        "factors": [
          { "name": "Sales Meetings", "points": 12, "max": 25, "matched": true, "reason": "2 meeting(s) logged" },
          { "name": "Phone Calls", "points": 4, "max": 25, "matched": true, "reason": "1 phone call(s) logged" },
          { "name": "Emails", "points": 3, "max": 25, "matched": true, "reason": "1 email interaction(s) logged" }
        ]
      },
      "opportunitySignal": {
        "score": 16,
        "max": 20,
        "factors": [
          { "name": "Late Stage Opportunity", "points": 16, "max": 20, "matched": true, "reason": "Associated with opportunity in NEGOTIATION stage" }
        ]
      },
      "recency": {
        "score": 15,
        "max": 15,
        "daysSinceInteraction": 0,
        "reason": "Interaction within last 24 hours"
      },
      "deductions": []
    }
  },
  "error": null
}
```

---

## 7. ADMINISTRATIVE BACKFILL SCRIPT

For upgrading existing deployments or recomputing all lead scores after algorithm version updates, an administrative script is provided:

### Execution
```bash
npm --prefix server run backfill:lead-scores
```

### Programmatic Invocation
```typescript
import { leadScoringService } from '@/modules/leads/lead-scoring.service.js';

// Backfill for a single tenant
const result = await leadScoringService.backfillAllLeads('org-uuid');
console.log(`Processed ${result.processed} leads with ${result.errors} errors.`);

// Backfill across all tenants
const globalResult = await leadScoringService.backfillAllLeads();
```

---

## 8. SECURITY & MULTI-TENANCY SUMMARY

1. **Authentication Scoping**: Every scoring operation requires `organizationId` obtained from the verified server session.
2. **IDOR & Enumeration Defense**: Requests for leads outside the tenant return `404 NOT_FOUND` with zero information disclosure.
3. **Anti-Tampering Protection**: Client requests submitting `score` or `scoreCategory` in `POST /api/leads` or `PUT /api/leads/:id` are overridden and recalculated server-side.
4. **Relational Isolation**: Opportunities and activities cross-referenced during calculation are strictly bounded by `organizationId`.
