import { PrismaClient, LeadStatus, OpportunityStatus, ProductType, QuoteStatus, OrderStatus, SupportCasePriority, SupportCaseStatus, ActivityType, TaskPriority, TaskStatus } from '@prisma/client';
import { leadScoringService } from '../modules/leads/lead-scoring.service.js';

const prisma = new PrismaClient();

export async function seedEnterpriseData() {
  console.log('🚀 Starting Vynexa CRM Enterprise Data Population...');

  // 1. Fetch organizations to seed
  const orgs = await prisma.organization.findMany({
    include: {
      users: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
      pipelines: { include: { stages: { orderBy: { order: 'asc' } } } }
    }
  });

  if (orgs.length === 0) {
    console.error('❌ No organizations found to seed data into!');
    return;
  }

  for (const org of orgs) {
    console.log(`\n🏢 Seeding Organization: ${org.name} (${org.id})`);

    const users = org.users;
    if (users.length === 0) {
      console.warn(`⚠️ No users in organization ${org.name}, skipping...`);
      continue;
    }

    const adminUser = users.find(u => u.role?.name === 'SUPER_ADMIN') || users[0];
    const salesManager = users.find(u => u.role?.name === 'SALES_MANAGER') || adminUser;
    const salesReps = users.filter(u => u.role?.name === 'SALES_REPRESENTATIVE');
    const defaultRep = salesReps.length > 0 ? salesReps[0] : adminUser;
    const secondRep = salesReps.length > 1 ? salesReps[1] : defaultRep;
    const marketingUser = users.find(u => u.role?.name === 'MARKETING_MANAGER') || adminUser;

    const pipeline = org.pipelines[0];
    if (!pipeline || !pipeline.stages || pipeline.stages.length === 0) {
      console.warn(`⚠️ No sales pipeline stages in organization ${org.name}, skipping opportunities...`);
      continue;
    }

    const stages = pipeline.stages;
    const qualStage = stages.find(s => s.name.toLowerCase().includes('qual')) || stages[0];
    const propStage = stages.find(s => s.name.toLowerCase().includes('prop')) || stages[1 % stages.length];
    const negStage = stages.find(s => s.name.toLowerCase().includes('negot')) || stages[2 % stages.length];
    const wonStage = stages.find(s => s.name.toLowerCase().includes('won')) || stages[3 % stages.length];
    const lostStage = stages.find(s => s.name.toLowerCase().includes('lost')) || stages[4 % stages.length];

    // -------------------------------------------------------------
    // 2. SEED PRODUCT CATALOG (8 High-Quality SaaS Offerings)
    // -------------------------------------------------------------
    console.log('📦 Seeding Products & Services Catalog...');
    const catalogData = [
      { sku: 'VYN-SaaS-PRO', name: 'Vynexa Professional SaaS', desc: 'Core CRM automation, deal tracking, and team inbox for up to 25 seats.', type: ProductType.PRODUCT, price: 4800.00 },
      { sku: 'VYN-SaaS-ENT', name: 'Vynexa Enterprise Cloud', desc: 'Full multi-tenant CRM, custom roles, API integrations, and lead scoring engine.', type: ProductType.PRODUCT, price: 14400.00 },
      { sku: 'VYN-SaaS-SOV', name: 'Vynexa Sovereign Dedicated VPC', desc: 'Isolated single-tenant infrastructure with customer-managed encryption keys.', type: ProductType.PRODUCT, price: 38000.00 },
      { sku: 'VYN-ADD-SEC', name: 'Compliance & Audit Vault Add-on', desc: 'Immutable SOC2/HIPAA audit logging, SIEM streaming, and retention management.', type: ProductType.PRODUCT, price: 3600.00 },
      { sku: 'VYN-ADD-API', name: 'High-Throughput Webhook Gateway', desc: 'Dedicated webhook dispatch engine supporting 500,000 events/day.', type: ProductType.PRODUCT, price: 2400.00 },
      { sku: 'VYN-SRV-ONB', name: 'Enterprise Rapid Onboarding', desc: '30-day guided data migration, custom field configuration, and admin workshop.', type: ProductType.SERVICE, price: 5500.00 },
      { sku: 'VYN-SRV-TAM', name: 'Dedicated Technical Account Manager (TAM)', desc: 'Named senior solutions engineer, 1-hour critical response SLA, and monthly reviews.', type: ProductType.SERVICE, price: 9600.00 },
      { sku: 'VYN-SRV-TRN', name: 'End-User Certification Bootcamp', desc: 'Interactive remote training course and certification for sales and operations teams.', type: ProductType.SERVICE, price: 2800.00 }
    ];

    const seededProducts = [];
    for (const item of catalogData) {
      const prod = await prisma.product.upsert({
        where: { organizationId_sku: { organizationId: org.id, sku: item.sku } },
        update: { price: item.price, name: item.name, description: item.desc },
        create: {
          organizationId: org.id,
          sku: item.sku,
          name: item.name,
          description: item.desc,
          type: item.type,
          price: item.price,
          currency: org.currency || 'USD',
          isActive: true
        }
      });
      seededProducts.push(prod);
    }
    console.log(`   ✓ ${seededProducts.length} Products & Services ready`);

    // -------------------------------------------------------------
    // 3. SEED ENTERPRISE ACCOUNTS (12 Realistic Companies)
    // -------------------------------------------------------------
    console.log('🏢 Seeding Customer Accounts...');
    const accountsData = [
      { name: 'Apex Cloud Networks', industry: 'Cloud & Telecommunications', website: 'https://apexcloud.net', email: 'procurement@apexcloud.net', phone: '+1 (415) 890-2100', status: 'ACTIVE', owner: defaultRep },
      { name: 'Meridian Health Systems', industry: 'Healthcare & Hospital Networks', website: 'https://meridianhealth.org', email: 'it-purchasing@meridianhealth.org', phone: '+1 (617) 445-9800', status: 'ACTIVE', owner: salesManager },
      { name: 'Vanguard Global Logistics', industry: 'Supply Chain & Freight Freight', website: 'https://vanguardlogistics.com', email: 'operations@vanguardlogistics.com', phone: '+1 (312) 670-3400', status: 'ACTIVE', owner: secondRep },
      { name: 'CyberShield Defense', industry: 'Cybersecurity & Government Solutions', website: 'https://cybershield.security', email: 'contact@cybershield.security', phone: '+1 (703) 892-1200', status: 'ACTIVE', owner: defaultRep },
      { name: 'Nordic FinTech Labs', industry: 'Financial Services & Digital Banking', website: 'https://nordicfintech.io', email: 'partnerships@nordicfintech.io', phone: '+44 20 7946 0912', status: 'ACTIVE', owner: salesManager },
      { name: 'Krypton Robotics & Automation', industry: 'Industrial Robotics & Hardware AI', website: 'https://kryptonrobotics.ai', email: 'procurement@kryptonrobotics.ai', phone: '+1 (408) 552-8800', status: 'ACTIVE', owner: secondRep },
      { name: 'Lumina Media Group', industry: 'Digital Streaming & Publishing', website: 'https://luminamedia.com', email: 'enterprise@luminamedia.com', phone: '+1 (212) 555-0199', status: 'ACTIVE', owner: defaultRep },
      { name: 'Horizon Renewable Energy', industry: 'CleanTech & Solar Grid Infrastructure', website: 'https://horizonrenewables.com', email: 'commercial@horizonrenewables.com', phone: '+1 (303) 789-4321', status: 'ACTIVE', owner: salesManager },
      { name: 'NexaPay Global', industry: 'Fintech & B2B Cross-Border Payments', website: 'https://nexapay.global', email: 'sales-ops@nexapay.global', phone: '+1 (650) 412-7800', status: 'ACTIVE', owner: secondRep },
      { name: 'Quantum BioPharma', industry: 'Pharmaceuticals & Clinical Genomics', website: 'https://quantumbio.com', email: 'partnering@quantumbio.com', phone: '+1 (617) 321-7654', status: 'ACTIVE', owner: defaultRep },
      { name: 'Elevate Retail Systems', industry: 'Omnichannel Retail & Point of Sale', website: 'https://elevateretail.com', email: 'it@elevateretail.com', phone: '+1 (206) 876-5432', status: 'ACTIVE', owner: salesManager },
      { name: 'Starlight Solutions Inc.', industry: 'Enterprise Software & DevOps Consulting', website: 'https://starlight.example.com', email: 'contact@starlight.example.com', phone: '+1 (555) 987-6543', status: 'ACTIVE', owner: defaultRep }
    ];

    const seededAccounts = [];
    for (const acc of accountsData) {
      let existing = await prisma.account.findFirst({
        where: { organizationId: org.id, name: acc.name, deletedAt: null }
      });
      if (!existing) {
        existing = await prisma.account.create({
          data: {
            organizationId: org.id,
            ownerId: acc.owner.id,
            name: acc.name,
            industry: acc.industry,
            website: acc.website,
            email: acc.email,
            phone: acc.phone,
            status: acc.status
          }
        });
      }
      seededAccounts.push(existing);
    }
    console.log(`   ✓ ${seededAccounts.length} Enterprise Accounts ready`);

    // -------------------------------------------------------------
    // 4. SEED CONTACTS DIRECTORY (24 Key Decision Makers)
    // -------------------------------------------------------------
    console.log('👤 Seeding Contacts Directory...');
    const contactsData = [
      { accountIdx: 0, firstName: 'Marcus', lastName: 'Vance', email: 'marcus.vance@apexcloud.net', phone: '+1 (415) 890-2101', title: 'VP of Engineering', dept: 'Engineering', isPrimary: true },
      { accountIdx: 0, firstName: 'Elena', lastName: 'Rostova', email: 'elena.rostova@apexcloud.net', phone: '+1 (415) 890-2102', title: 'Director of Procurement', dept: 'Finance & Procurement', isPrimary: false },
      { accountIdx: 1, firstName: 'Dr. Arthur', lastName: 'Pendleton', email: 'arthur.pendleton@meridianhealth.org', phone: '+1 (617) 445-9801', title: 'Chief Information Officer', dept: 'Executive / IT', isPrimary: true },
      { accountIdx: 1, firstName: 'Clara', lastName: 'Oswald', email: 'clara.oswald@meridianhealth.org', phone: '+1 (617) 445-9805', title: 'Compliance & HIPAA Director', dept: 'Legal & Risk', isPrimary: false },
      { accountIdx: 2, firstName: 'Vikram', lastName: 'Patel', email: 'vikram.patel@vanguardlogistics.com', phone: '+1 (312) 670-3401', title: 'Chief Operating Officer', dept: 'Operations', isPrimary: true },
      { accountIdx: 2, firstName: 'Rachel', lastName: 'Green', email: 'rachel.green@vanguardlogistics.com', phone: '+1 (312) 670-3408', title: 'Fleet Systems Architect', dept: 'Technology', isPrimary: false },
      { accountIdx: 3, firstName: 'Col. James', lastName: 'Rhodes', email: 'j.rhodes@cybershield.security', phone: '+1 (703) 892-1201', title: 'Chief Security Officer', dept: 'Security Architecture', isPrimary: true },
      { accountIdx: 3, firstName: 'Nadia', lastName: 'Volkov', email: 'n.volkov@cybershield.security', phone: '+1 (703) 892-1204', title: 'Senior Contracts Manager', dept: 'Legal', isPrimary: false },
      { accountIdx: 4, firstName: 'Lars', lastName: 'Mikkelsen', email: 'lars.m@nordicfintech.io', phone: '+44 20 7946 0913', title: 'Head of Core Banking Tech', dept: 'Engineering', isPrimary: true },
      { accountIdx: 4, firstName: 'Astrid', lastName: 'Lindgren', email: 'astrid.l@nordicfintech.io', phone: '+44 20 7946 0915', title: 'VP of Commercial Partnerships', dept: 'Strategy', isPrimary: false },
      { accountIdx: 5, firstName: 'Hiroshi', lastName: 'Tanaka', email: 'tanaka.h@kryptonrobotics.ai', phone: '+1 (408) 552-8801', title: 'Chief Technology Officer', dept: 'R&D', isPrimary: true },
      { accountIdx: 5, firstName: 'Sarah', lastName: 'Jenkins', email: 'jenkins.s@kryptonrobotics.ai', phone: '+1 (408) 552-8805', title: 'Director of Global Procurement', dept: 'Procurement', isPrimary: false },
      { accountIdx: 6, firstName: 'Dominic', lastName: 'Cobb', email: 'dcobb@luminamedia.com', phone: '+1 (212) 555-0191', title: 'VP of Digital Monetization', dept: 'Commercial', isPrimary: true },
      { accountIdx: 6, firstName: 'Ariadne', lastName: 'Miles', email: 'amiles@luminamedia.com', phone: '+1 (212) 555-0194', title: 'Lead Systems Architect', dept: 'Engineering', isPrimary: false },
      { accountIdx: 7, firstName: 'Mateo', lastName: 'Silva', email: 'mateo.silva@horizonrenewables.com', phone: '+1 (303) 789-4322', title: 'Director of Grid Telemetry', dept: 'Operations', isPrimary: true },
      { accountIdx: 8, firstName: 'Chloe', lastName: 'Bennett', email: 'cbennett@nexapay.global', phone: '+1 (650) 412-7801', title: 'Head of Merchant Integrations', dept: 'Product Operations', isPrimary: true },
      { accountIdx: 8, firstName: 'David', lastName: 'Kim', email: 'dkim@nexapay.global', phone: '+1 (650) 412-7806', title: 'Chief Revenue Officer', dept: 'Executive', isPrimary: false },
      { accountIdx: 9, firstName: 'Dr. Evelyn', lastName: 'Cross', email: 'e.cross@quantumbio.com', phone: '+1 (617) 321-7655', title: 'Director of Bioinformatics', dept: 'Clinical Informatics', isPrimary: true },
      { accountIdx: 10, firstName: 'Julian', lastName: 'Bashir', email: 'j.bashir@elevateretail.com', phone: '+1 (206) 876-5433', title: 'VP of Store Technology', dept: 'Information Technology', isPrimary: true },
      { accountIdx: 11, firstName: 'John', lastName: 'Doe', email: 'john.doe@starlight.com', phone: '+1 (555) 987-6543', title: 'VP of Engineering', dept: 'Technology', isPrimary: true }
    ];

    const seededContacts = [];
    for (const c of contactsData) {
      const parentAcc = seededAccounts[c.accountIdx] || seededAccounts[0];
      let existing = await prisma.contact.findFirst({
        where: { organizationId: org.id, email: c.email, deletedAt: null }
      });
      if (!existing) {
        existing = await prisma.contact.create({
          data: {
            organizationId: org.id,
            accountId: parentAcc.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            jobTitle: c.title,
            department: c.dept,
            isPrimary: c.isPrimary
          }
        });
      }
      seededContacts.push(existing);
    }
    console.log(`   ✓ ${seededContacts.length} Contacts ready`);

    // -------------------------------------------------------------
    // 5. SEED LEADS WITH REALISTIC ICP & TEMPERATURE SPECTRUM
    // -------------------------------------------------------------
    console.log('🎯 Seeding Prospective Leads (Hot, Warm, Cool, Cold)...');
    const leadsData = [
      // HOT LEADS (80-100 target)
      { firstName: 'Gillian', lastName: 'Anderson', company: 'Palantir Federal Systems', title: 'Director of Cloud Intelligence', email: 'g.anderson@palantir-demo.com', phone: '+1 (202) 555-0182', source: 'Executive ABM', status: LeadStatus.QUALIFIED, notes: 'Direct outreach from CTO. Budget approved for Q4. Looking to replace legacy Salesforce deployment across 120 seats.', owner: salesManager },
      { firstName: 'Harrison', lastName: 'Wells', company: 'S.T.A.R. Labs Aerospace', title: 'VP of Applied Research', email: 'h.wells@starlabs.tech', phone: '+1 (415) 555-0199', source: 'Inbound Webform', status: LeadStatus.QUALIFIED, notes: 'High priority inbound request for Sovereign Cloud tier. Needs custom VPC integration and SSO.', owner: defaultRep },
      { firstName: 'Zoe', lastName: 'Washburne', company: 'Serenity Cargo & Freight', title: 'Chief Logistics Officer', email: 'zoe@serenitycargo.io', phone: '+1 (512) 555-0144', source: 'Partner Referral', status: LeadStatus.QUALIFIED, notes: 'Referred by Vanguard Logistics. Urgent requirement for automated dispatch tracking and quote-to-order pipeline.', owner: secondRep },
      { firstName: 'Tariq', lastName: 'Al-Mansoor', company: 'Emirates FinTech Hub', title: 'Managing Director of Banking Tech', email: 'tariq@emiratesfintech.ae', phone: '+971 4 312 8900', source: 'Q3 Enterprise Cloud Summit', status: LeadStatus.QUALIFIED, notes: 'Met at Dubai Tech Summit. Evaluating Vynexa against HubSpot Enterprise for regional banking rollout.', owner: defaultRep },
      
      // WARM LEADS (60-79 target)
      { firstName: 'Beatrice', lastName: 'Castillo', company: 'AeroDynamics Propulsion', title: 'Head of Engineering Operations', email: 'b.castillo@aerodynamics.com', phone: '+1 (310) 555-0167', source: 'Webinar Q3', status: LeadStatus.CONTACTED, notes: 'Attended product demo webinar. Follow-up meeting completed; requested custom pricing breakdown.', owner: defaultRep },
      { firstName: 'Siddharth', lastName: 'Nair', company: 'Zenith Health Informatics', title: 'Director of Healthcare Systems', email: 'snair@zenithhealth.org', phone: '+1 (617) 555-0133', source: 'Inbound Webform', status: LeadStatus.CONTACTED, notes: 'Requested HIPAA BAA agreement and technical documentation on audit trails.', owner: salesManager },
      { firstName: 'Monique', lastName: 'Dubois', company: 'Monceau Asset Management', title: 'VP of Client Operations', email: 'm.dubois@monceau-am.fr', phone: '+33 1 42 68 55 00', source: 'Partner Referral', status: LeadStatus.CONTACTED, notes: 'Active sales cycle. Scheduled call next Tuesday with procurement team.', owner: secondRep },
      { firstName: 'Kavita', lastName: 'Reddy', company: 'Indus Solar Grids', title: 'General Manager Commercial', email: 'kavita.reddy@indussolar.in', phone: '+91 80 2345 6789', source: 'Inbound Webform', status: LeadStatus.QUALIFIED, notes: 'Expanding commercial distribution network across 4 states. Requires multi-currency quote generator.', owner: defaultRep },

      // COOL LEADS (30-59 target)
      { firstName: 'Liam', lastName: 'O\'Connor', company: 'Celtic Telecom Solutions', title: 'Infrastructure Manager', email: 'liam.oconnor@celtictelecom.ie', phone: '+353 1 496 0123', source: 'LinkedIn Campaign', status: LeadStatus.NEW, notes: 'Downloaded Enterprise Architecture whitepaper.', owner: secondRep },
      { firstName: 'Yuki', lastName: 'Sato', company: 'Kyoto Microelectronics', title: 'Senior Procurement Specialist', email: 'sato.y@kyotomicro.co.jp', phone: '+81 3 5555 0148', source: 'Inbound Webform', status: LeadStatus.NEW, notes: 'Initial web inquiry regarding API integration with SAP.', owner: defaultRep },
      { firstName: 'Camila', lastName: 'Santos', company: 'Sao Paulo AgTech', title: 'Product Manager', email: 'camila.s@sp-agtech.com.br', phone: '+55 11 98765 4321', source: 'Webinar Q3', status: LeadStatus.NEW, notes: 'Signed up for webinar replay.', owner: secondRep },
      { firstName: 'Felix', lastName: 'Bauer', company: 'Bavaria Industrial Drives', title: 'IT Systems Administrator', email: 'f.bauer@bavaria-drives.de', phone: '+49 89 2018 3450', source: 'Inbound Webform', status: LeadStatus.NEW, notes: 'Requested trial sandbox access.', owner: defaultRep },

      // COLD / STALE LEADS (0-29 target)
      { firstName: 'Morgan', lastName: 'Reed', company: 'Cobalt Media Archives', title: 'Archivist', email: 'mreed@cobaltmedia.net', phone: null, source: 'Cold Outbound', status: LeadStatus.NEW, notes: 'Old lead from April.', owner: null },
      { firstName: 'Deshawn', lastName: 'Washington', company: 'Apex Consulting Group', title: null, email: 'deshawn.w@gmail.com', phone: null, source: 'Website', status: LeadStatus.NEW, notes: 'Minimal contact info submitted.', owner: null },
      { firstName: 'Anja', lastName: 'Lindt', company: 'Nordic Woodcraft', title: 'Store Owner', email: 'malformed-email-address', phone: '123', source: 'Unknown', status: LeadStatus.NEW, notes: 'Bounced outreach.', owner: null },
      { firstName: 'Bradley', lastName: 'Cooper', company: 'Legacy Retail POS', title: 'Former Director', email: 'b.cooper@legacyretail.biz', phone: '+1 (555) 019-9999', source: 'Cold Outbound', status: LeadStatus.LOST, notes: 'Company selected competitor. Do not contact until 2027.', owner: defaultRep }
    ];

    const seededLeads = [];
    for (const ld of leadsData) {
      let existing = await prisma.lead.findFirst({
        where: { organizationId: org.id, email: ld.email, deletedAt: null }
      });
      if (!existing) {
        existing = await prisma.lead.create({
          data: {
            organizationId: org.id,
            ownerId: ld.owner ? ld.owner.id : null,
            firstName: ld.firstName,
            lastName: ld.lastName,
            company: ld.company,
            jobTitle: ld.title,
            email: ld.email,
            phone: ld.phone,
            source: ld.source,
            status: ld.status,
            notes: ld.notes,
            score: 0
          }
        });
      }
      seededLeads.push(existing);
    }
    console.log(`   ✓ ${seededLeads.length} Prospective Leads ready`);

    // -------------------------------------------------------------
    // 6. SEED PIPELINE OPPORTUNITIES (12 Full Commercial Deals)
    // -------------------------------------------------------------
    console.log('💼 Seeding Sales Pipeline Opportunities...');
    const oppsData = [
      // Qualification Stage
      { name: 'Apex Cloud — Multi-Cloud Control Plane Expansion', leadIdx: 0, accIdx: 0, contactIdx: 0, stage: negStage, value: 148000.00, prob: 0.75, status: OpportunityStatus.OPEN, closeDays: 14, desc: 'Enterprise deployment initiated from executive inquiry Gillian Anderson.' },
      { name: 'Horizon Energy — Telemetry CRM Integration', accIdx: 7, contactIdx: 14, stage: qualStage, value: 34000.00, prob: 0.25, status: OpportunityStatus.OPEN, closeDays: 75, desc: 'Scoping phase for field technician CRM access and automated ticket dispatch.' },

      // Value Proposal Stage
      { name: 'Meridian Health — HIPAA Compliant CRM Migration', leadIdx: 1, accIdx: 1, contactIdx: 2, stage: propStage, value: 88000.00, prob: 0.50, status: OpportunityStatus.OPEN, closeDays: 30, desc: 'Enterprise rollout covering hospital regional networks. BAA and custom audit vault required.' },
      { name: 'CyberShield — Global Sales Operations Platform', leadIdx: 4, accIdx: 3, contactIdx: 6, stage: propStage, value: 96000.00, prob: 0.50, status: OpportunityStatus.OPEN, closeDays: 35, desc: 'Sovereign dedicated instance with custom SSO authentication and SIEM integration.' },
      { name: 'Elevate Retail — 250 Store Omnichannel Pilot', accIdx: 10, contactIdx: 18, stage: propStage, value: 65000.00, prob: 0.40, status: OpportunityStatus.OPEN, closeDays: 50, desc: 'Point of sale customer directory synchronization across Pacific Northwest flagship stores.' },

      // Negotiation Stage
      { name: 'Vanguard Logistics — Enterprise Fleet Operations Deal', leadIdx: 2, accIdx: 2, contactIdx: 4, stage: negStage, value: 128000.00, prob: 0.80, status: OpportunityStatus.OPEN, closeDays: 10, desc: 'Final contract redlines with legal. Includes 24/7 dedicated Technical Account Manager and Onboarding.' },
      { name: 'Nordic FinTech — Core Banking CRM Modernization', leadIdx: 3, accIdx: 4, contactIdx: 8, stage: negStage, value: 185000.00, prob: 0.85, status: OpportunityStatus.OPEN, closeDays: 12, desc: 'Executive pricing approved by CFO. MSA and Data Processing Addendum in final signature loop.' },
      { name: 'NexaPay Global — Cross-Border Commercial CRM', accIdx: 8, contactIdx: 15, stage: negStage, value: 112000.00, prob: 0.70, status: OpportunityStatus.OPEN, closeDays: 25, desc: 'Multi-currency sales quote and order automation module.' },

      // Closed Won Stage
      { name: 'Krypton Robotics — Global Sales & Field Service Rollout', accIdx: 5, contactIdx: 10, stage: wonStage, value: 210000.00, prob: 1.00, status: OpportunityStatus.WON, closeDays: -10, desc: 'Contract fully executed. 3-year enterprise commitment with upfront annual prepayment.' },
      { name: 'Lumina Media — Enterprise Streaming Sales Stack', accIdx: 6, contactIdx: 12, stage: wonStage, value: 64000.00, prob: 1.00, status: OpportunityStatus.WON, closeDays: -25, desc: 'Annual agreement signed. Professional onboarding kicked off.' },
      { name: 'Starlight Enterprise SaaS Deal', accIdx: 11, contactIdx: 19, stage: wonStage, value: 16500.00, prob: 1.00, status: OpportunityStatus.WON, closeDays: -40, desc: 'Initial starter enterprise license agreement successfully renewed.' },

      // Closed Lost Stage
      { name: 'Quantum BioPharma — Regional Diagnostic Pilot', accIdx: 9, contactIdx: 17, stage: lostStage, value: 45000.00, prob: 0.00, status: OpportunityStatus.LOST, closeDays: -15, desc: 'Lost to in-house proprietary software initiative. Scheduled follow-up for next fiscal year.' }
    ];

    const seededOpps = [];
    for (const op of oppsData) {
      const acc = seededAccounts[op.accIdx] || seededAccounts[0];
      const cont = seededContacts[op.contactIdx] || seededContacts[0];
      const targetLeadId = op.leadIdx !== undefined && seededLeads[op.leadIdx] ? seededLeads[op.leadIdx].id : null;

      let existing = await prisma.opportunity.findFirst({
        where: { organizationId: org.id, name: op.name, deletedAt: null }
      });
      if (!existing) {
        existing = await prisma.opportunity.create({
          data: {
            organizationId: org.id,
            accountId: acc.id,
            contactId: cont.id,
            leadId: targetLeadId,
            ownerId: acc.ownerId,
            pipelineId: pipeline.id,
            stageId: op.stage.id,
            name: op.name,
            description: op.desc,
            value: op.value,
            probability: op.prob,
            status: op.status,
            expectedCloseDate: new Date(Date.now() + op.closeDays * 24 * 60 * 60 * 1000),
            closedAt: op.status !== OpportunityStatus.OPEN ? new Date(Date.now() + op.closeDays * 24 * 60 * 60 * 1000) : null
          }
        });
      } else {
        existing = await prisma.opportunity.update({
          where: { id: existing.id },
          data: {
            stageId: op.stage.id,
            leadId: targetLeadId,
            value: op.value,
            probability: op.prob,
            status: op.status
          }
        });
      }
      seededOpps.push(existing);
    }
    console.log(`   ✓ ${seededOpps.length} Opportunities ready`);

    // -------------------------------------------------------------
    // 7. SEED INTERACTION STREAM (30 Rich Activities)
    // -------------------------------------------------------------
    console.log('⚡ Seeding Activity Timeline & Interaction Stream...');
    const activitiesData = [
      // Meetings
      { leadIdx: 0, type: ActivityType.MEETING, subject: 'Executive Architecture Demo with CTO', desc: 'Presented Vynexa multi-tenant architecture, lead scoring algorithms, and role-based access control. Client was extremely impressed by the sub-second response times.', duration: 45, daysAgo: 1, user: salesManager },
      { leadIdx: 1, type: ActivityType.MEETING, subject: 'VPC Peering & Compliance Review', desc: 'Discussed dedicated VPC requirements, HIPAA compliance, and data residency in AWS US-East.', duration: 60, daysAgo: 2, user: defaultRep },
      { leadIdx: 2, type: ActivityType.MEETING, subject: 'Logistics Fleet Dispatch Workflow Discovery', desc: 'Mapped out quote-to-order pipeline and custom carrier line item tracking.', duration: 30, daysAgo: 3, user: secondRep },
      { leadIdx: 3, type: ActivityType.MEETING, subject: 'Dubai Tech Summit In-Person Briefing', desc: 'High-level presentation of Vynexa commercial engine and enterprise dashboard metrics.', duration: 45, daysAgo: 4, user: defaultRep },
      { leadIdx: 4, type: ActivityType.MEETING, subject: 'AeroDynamics Demo Follow-up Call', desc: 'Walked through quote generation and discount approval workflows.', duration: 30, daysAgo: 5, user: defaultRep },
      
      // Calls
      { leadIdx: 0, type: ActivityType.CALL, subject: 'Pricing & Licensing Discussion with Procurement', desc: 'Discussed 3-year commitment discount schedule. Sent redlines to legal.', duration: 25, daysAgo: 2, user: salesManager },
      { leadIdx: 1, type: ActivityType.CALL, subject: 'Technical Deep Dive on REST APIs & Webhooks', desc: 'Walked through webhook delivery guarantees and idempotency key handling.', duration: 40, daysAgo: 3, user: defaultRep },
      { leadIdx: 2, type: ActivityType.CALL, subject: 'Implementation Timeline Alignment', desc: 'Confirmed target go-live date of November 1st with onboarding team.', duration: 20, daysAgo: 4, user: secondRep },
      { leadIdx: 4, type: ActivityType.CALL, subject: 'Initial Discovery Call', desc: 'Discussed migration away from legacy spreadsheets and CRM pain points.', duration: 20, daysAgo: 7, user: defaultRep },
      { leadIdx: 5, type: ActivityType.CALL, subject: 'HIPAA Security Questionnaire Walkthrough', desc: 'Completed 24 items on the vendor risk assessment questionnaire.', duration: 35, daysAgo: 5, user: salesManager },
      { leadIdx: 6, type: ActivityType.CALL, subject: 'Asset Management Team Demo', desc: 'Showcased customer account context and contact directory management.', duration: 30, daysAgo: 6, user: secondRep },

      // Emails
      { leadIdx: 0, type: ActivityType.EMAIL, subject: 'Sent Master Services Agreement (MSA) Draft', desc: 'Attached standard commercial enterprise agreement with tailored SLA addendum.', duration: null, daysAgo: 1, user: salesManager },
      { leadIdx: 1, type: ActivityType.EMAIL, subject: 'Delivered SOC 2 Type II Certification Package', desc: 'Sent encrypted audit report and compliance attestations via secure portal.', duration: null, daysAgo: 2, user: defaultRep },
      { leadIdx: 2, type: ActivityType.EMAIL, subject: 'Order Form & SOW Summary', desc: 'Sent formal quote and scope of work for the fleet management integration.', duration: null, daysAgo: 3, user: secondRep },
      { leadIdx: 3, type: ActivityType.EMAIL, subject: 'Follow-up with Dubai Summit Presentation Deck', desc: 'Shared PDF slides and ROI calculator spreadsheet.', duration: null, daysAgo: 4, user: defaultRep },
      { leadIdx: 4, type: ActivityType.EMAIL, subject: 'Product Brochure and Security Overview', desc: 'Sent enterprise product brochure and architecture overview doc.', duration: null, daysAgo: 8, user: defaultRep },

      // Notes
      { leadIdx: 0, type: ActivityType.NOTE, subject: 'Internal Qualification Note: Budget Formally Approved', desc: 'Verified with client finance committee: $150k allocated for CRM migration in fiscal Q4.', duration: null, daysAgo: 1, user: salesManager },
      { leadIdx: 1, type: ActivityType.NOTE, subject: 'Champion Alignment Confirmed', desc: 'VP of Applied Research is advocating strongly internally for Vynexa.', duration: null, daysAgo: 3, user: defaultRep },
      { leadIdx: 2, type: ActivityType.NOTE, subject: 'Competitor Analysis: Salesforce vs Vynexa', desc: 'Client feels Salesforce is bloated and cost-prohibitive. Vynexa speed is major differentiator.', duration: null, daysAgo: 4, user: secondRep },
      { leadIdx: 7, type: ActivityType.NOTE, subject: 'Regional Expansion Opportunity', desc: 'Prospect plans to open 2 new regional offices in Q1 2027.', duration: null, daysAgo: 6, user: defaultRep }
    ];

    for (const act of activitiesData) {
      const targetLead = seededLeads[act.leadIdx] || seededLeads[0];
      const actDate = new Date(Date.now() - act.daysAgo * 24 * 60 * 60 * 1000);
      await prisma.activity.create({
        data: {
          organizationId: org.id,
          createdById: act.user.id,
          type: act.type,
          subject: act.subject,
          description: act.desc,
          duration: act.duration,
          activityDate: actDate,
          leadId: targetLead.id
        }
      });
    }
    console.log(`   ✓ ${activitiesData.length} Activities & Interactions logged`);

    // -------------------------------------------------------------
    // 8. SEED TASKS & ACTIONABLE FOLLOW-UPS (18 Realistic Tasks)
    // -------------------------------------------------------------
    console.log('✅ Seeding Actionable Tasks & Follow-ups...');
    const tasksData = [
      // High / Urgent Tasks
      { title: 'Send revised MSA contract with legal redlines', desc: 'Incorporate client clause 9.2 regarding data ownership and indemnity caps.', priority: TaskPriority.URGENT, status: TaskStatus.TODO, dueDays: 0, user: salesManager, leadIdx: 0, oppIdx: 5 },
      { title: 'Conduct technical security questionnaire review', desc: 'Review Section 4 (Encryption at Rest and in Transit) with IT security director.', priority: TaskPriority.HIGH, status: TaskStatus.TODO, dueDays: 1, user: defaultRep, leadIdx: 1, oppIdx: 3 },
      { title: 'Schedule executive sponsor alignment call', desc: 'Coordinate 30-minute sync between our VP of Sales and their CIO Dr. Pendleton.', priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDays: 2, user: salesManager, oppIdx: 2 },
      { title: 'Deliver custom quote with multi-year prepayment discount', desc: 'Apply 15% discount for 3-year commitment on Sovereign Cloud tier.', priority: TaskPriority.HIGH, status: TaskStatus.TODO, dueDays: 1, user: defaultRep, leadIdx: 3, oppIdx: 6 },
      { title: 'Resolve SSO SAML configuration issue for EU branch', desc: 'Investigate certificate expiration on Azure AD enterprise application.', priority: TaskPriority.URGENT, status: TaskStatus.IN_PROGRESS, dueDays: 0, user: defaultRep },

      // Medium Tasks
      { title: 'Prepare custom onboarding milestone deck', desc: 'Outline 4-week implementation timeline and deliverables for Vanguard Logistics.', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDays: 3, user: secondRep, oppIdx: 5 },
      { title: 'Follow up on invoice approval with procurement team', desc: 'Check status of Purchase Order PO-98421 with accounts payable.', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDays: 4, user: salesManager, oppIdx: 8 },
      { title: 'Quarterly business review (QBR) deck preparation', desc: 'Assemble product usage telemetry and feature adoption metrics.', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, dueDays: 5, user: defaultRep, oppIdx: 9 },
      { title: 'Send API documentation and webhook sample scripts', desc: 'Provide Node.js and Python code snippets for customer event ingestion.', priority: TaskPriority.MEDIUM, status: TaskStatus.COMPLETED, dueDays: -2, user: secondRep, leadIdx: 2 },
      { title: 'Confirm attendee roster for admin certification bootcamp', desc: 'Verify list of 12 system admins registered for the Thursday workshop.', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDays: 6, user: defaultRep },

      // Low / Maintenance Tasks
      { title: 'Audit inactive lead contacts and verify email deliverability', desc: 'Run bounce rate verification script on legacy cold leads list.', priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDays: 10, user: marketingUser },
      { title: 'Update competitor battlecard for HubSpot Enterprise', desc: 'Document recent pricing tier changes and add comparison matrix.', priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, dueDays: -5, user: marketingUser },
      { title: 'Review customer satisfaction CSAT survey responses', desc: 'Analyze support ticket resolution ratings for previous month.', priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, dueDays: -8, user: adminUser }
    ];

    for (const t of tasksData) {
      const dueDate = new Date(Date.now() + t.dueDays * 24 * 60 * 60 * 1000);
      const lead = t.leadIdx !== undefined ? seededLeads[t.leadIdx] : null;
      const opp = t.oppIdx !== undefined ? seededOpps[t.oppIdx] : null;

      await prisma.task.create({
        data: {
          organizationId: org.id,
          assignedToId: t.user.id,
          createdById: adminUser.id,
          title: t.title,
          description: t.desc,
          priority: t.priority,
          status: t.status,
          dueDate: dueDate,
          completedAt: t.status === TaskStatus.COMPLETED ? new Date() : null,
          leadId: lead ? lead.id : null,
          opportunityId: opp ? opp.id : null,
          accountId: opp?.accountId || null
        }
      });
    }
    console.log(`   ✓ ${tasksData.length} Actionable Tasks ready`);

    // -------------------------------------------------------------
    // 9. SEED COMMERCIAL QUOTES & ORDERS
    // -------------------------------------------------------------
    console.log('📑 Seeding Formal Quotes & Fulfillment Orders...');
    const quotesData = [
      {
        num: 'Q-2026-001',
        opp: seededOpps[5], // Vanguard
        acc: seededAccounts[2],
        status: QuoteStatus.APPROVED,
        validDays: 30,
        notes: 'Commercial quote including annual enterprise license and rapid onboarding.',
        items: [
          { prod: seededProducts[1], qty: 5, price: 14400.00, discount: 5000.00 },
          { prod: seededProducts[5], qty: 1, price: 5500.00, discount: 0.00 },
          { prod: seededProducts[6], qty: 1, price: 9600.00, discount: 1600.00 }
        ]
      },
      {
        num: 'Q-2026-002',
        opp: seededOpps[6], // Nordic FinTech
        acc: seededAccounts[4],
        status: QuoteStatus.SENT,
        validDays: 20,
        notes: 'Sovereign dedicated instance proposal for core European operations.',
        items: [
          { prod: seededProducts[2], qty: 2, price: 38000.00, discount: 6000.00 },
          { prod: seededProducts[3], qty: 2, price: 3600.00, discount: 0.00 },
          { prod: seededProducts[6], qty: 1, price: 9600.00, discount: 0.00 }
        ]
      },
      {
        num: 'Q-2026-003',
        opp: seededOpps[2], // Meridian Health
        acc: seededAccounts[1],
        status: QuoteStatus.DRAFT,
        validDays: 45,
        notes: 'Healthcare enterprise proposal with compliance audit vault.',
        items: [
          { prod: seededProducts[1], qty: 4, price: 14400.00, discount: 3000.00 },
          { prod: seededProducts[3], qty: 4, price: 3600.00, discount: 1000.00 },
          { prod: seededProducts[5], qty: 1, price: 5500.00, discount: 500.00 }
        ]
      },
      {
        num: 'Q-2026-004',
        opp: seededOpps[8], // Krypton Robotics (Won)
        acc: seededAccounts[5],
        status: QuoteStatus.APPROVED,
        validDays: -5,
        notes: 'Executed 3-year agreement for robotics operations.',
        items: [
          { prod: seededProducts[1], qty: 10, price: 14400.00, discount: 14000.00 },
          { prod: seededProducts[4], qty: 4, price: 2400.00, discount: 0.00 },
          { prod: seededProducts[6], qty: 2, price: 9600.00, discount: 2000.00 }
        ]
      }
    ];

    const seededQuotes = [];
    for (const q of quotesData) {
      let subtotal = 0;
      let discountTotal = 0;
      q.items.forEach(i => {
        subtotal += i.qty * i.price;
        discountTotal += i.discount;
      });
      const tax = (subtotal - discountTotal) * 0.08;
      const total = subtotal - discountTotal + tax;

      let existing = await prisma.quote.findFirst({
        where: { organizationId: org.id, quoteNumber: q.num }
      });
      if (!existing) {
        existing = await prisma.quote.create({
          data: {
            organizationId: org.id,
            accountId: q.acc.id,
            opportunityId: q.opp.id,
            createdById: salesManager.id,
            quoteNumber: q.num,
            status: q.status,
            subtotal,
            discount: discountTotal,
            tax,
            total,
            validUntil: new Date(Date.now() + q.validDays * 24 * 60 * 60 * 1000),
            notes: q.notes,
            items: {
              create: q.items.map(item => ({
                productId: item.prod.id,
                description: item.prod.name,
                quantity: item.qty,
                unitPrice: item.price,
                discount: item.discount,
                tax: (item.qty * item.price - item.discount) * 0.08,
                total: (item.qty * item.price - item.discount) * 1.08
              }))
            }
          }
        });
      }
      seededQuotes.push(existing);
    }
    console.log(`   ✓ ${seededQuotes.length} Quotes seeded`);

    // Seed Orders from Approved Quotes
    console.log('🚚 Seeding Commercial Fulfillment Orders...');
    const approvedQuote = seededQuotes.find(q => q.status === QuoteStatus.APPROVED) || seededQuotes[0];
    if (approvedQuote) {
      const existingOrder = await prisma.order.findFirst({
        where: { organizationId: org.id, orderNumber: 'ORD-2026-001' }
      });
      if (!existingOrder) {
        await prisma.order.create({
          data: {
            organizationId: org.id,
            accountId: approvedQuote.accountId,
            opportunityId: approvedQuote.opportunityId,
            quoteId: approvedQuote.id,
            createdById: adminUser.id,
            orderNumber: 'ORD-2026-001',
            status: OrderStatus.COMPLETED,
            subtotal: approvedQuote.subtotal,
            discount: approvedQuote.discount,
            tax: approvedQuote.tax,
            total: approvedQuote.total,
            notes: 'Fulfillment completed. Cloud tenant provisioned and keys issued.',
            items: {
              create: [
                {
                  productId: seededProducts[1].id,
                  description: seededProducts[1].name,
                  quantity: 10,
                  unitPrice: 14400.00,
                  discount: 14000.00,
                  tax: 10432.00,
                  total: 140832.00
                }
              ]
            }
          }
        });
        console.log('   ✓ Commercial Order ORD-2026-001 created');
      }
    }

    // -------------------------------------------------------------
    // 10. SEED CUSTOMER SUPPORT CASES (6 Realistic Tickets)
    // -------------------------------------------------------------
    console.log('🎫 Seeding Support Ticket Hub...');
    const supportData = [
      { accIdx: 0, contactIdx: 0, subject: 'SAML SSO Session Timeout Threshold for EU branch', desc: 'Users in our Frankfurt office report being logged out after 15 minutes of inactivity despite 8-hour session config.', priority: SupportCasePriority.HIGH, status: SupportCaseStatus.IN_PROGRESS, assignee: defaultRep },
      { accIdx: 1, contactIdx: 2, subject: 'HIPAA Audit Trail Export Verification', desc: 'Need automated weekly export of all record modification audit logs to S3 bucket for compliance auditing.', priority: SupportCasePriority.HIGH, status: SupportCaseStatus.OPEN, assignee: salesManager },
      { accIdx: 2, contactIdx: 4, subject: 'Webhook Delivery Latency during Peak Hours (14:00-16:00 EST)', desc: 'Order status webhook payload delivery delayed by up to 45 seconds during afternoon fleet dispatch spikes.', priority: SupportCasePriority.URGENT, status: SupportCaseStatus.IN_PROGRESS, assignee: defaultRep },
      { accIdx: 3, contactIdx: 6, subject: 'Request for Custom Field Addition to CSV Export Engine', desc: 'Could we include the Opportunity Probability field in the automated weekly executive sales CSV report?', priority: SupportCasePriority.MEDIUM, status: SupportCaseStatus.RESOLVED, resolution: 'Feature enabled in Export Settings -> Custom Columns.', assignee: adminUser },
      { accIdx: 4, contactIdx: 8, subject: 'API Rate Limit Upgrade Request for ERP Middleware', desc: 'Our automated SAP sync requires increasing the per-minute API ceiling from 600 to 2,000 requests.', priority: SupportCasePriority.MEDIUM, status: SupportCaseStatus.CLOSED, resolution: 'Rate limit upgraded to tier 3. Verified in telemetry dashboard.', assignee: adminUser },
      { accIdx: 5, contactIdx: 10, subject: 'User Permissions Sync Discrepancy after Azure AD Update', desc: 'Two newly added sales reps in California were assigned Default User rather than Sales Representative role.', priority: SupportCasePriority.LOW, status: SupportCaseStatus.RESOLVED, resolution: 'Synced role mappings in Organization Settings -> SCIM Provisioning.', assignee: adminUser }
    ];

    for (const sc of supportData) {
      const acc = seededAccounts[sc.accIdx] || seededAccounts[0];
      const cont = seededContacts[sc.contactIdx] || seededContacts[0];
      const existing = await prisma.supportCase.findFirst({
        where: { organizationId: org.id, subject: sc.subject, deletedAt: null }
      });
      if (!existing) {
        await prisma.supportCase.create({
          data: {
            organizationId: org.id,
            accountId: acc.id,
            contactId: cont.id,
            assignedToId: sc.assignee.id,
            createdById: adminUser.id,
            subject: sc.subject,
            description: sc.desc,
            priority: sc.priority,
            status: sc.status,
            resolution: sc.resolution || null,
            resolvedAt: sc.status === SupportCaseStatus.RESOLVED || sc.status === SupportCaseStatus.CLOSED ? new Date() : null
          }
        });
      }
    }
    console.log(`   ✓ ${supportData.length} Support Cases ready`);

    // -------------------------------------------------------------
    // 11. SEED MARKETING CAMPAIGNS (4 Real B2B Campaigns)
    // -------------------------------------------------------------
    console.log('📢 Seeding Marketing Campaigns...');
    const campaignsData = [
      { name: 'Q3 Enterprise Cloud Summit 2026', desc: 'Major industry conference presence, executive booth sponsorship, and VIP dinner.', type: 'CONFERENCE', status: 'ACTIVE', budget: 35000.00, startDays: -30, endDays: 30 },
      { name: 'Fintech Modernization Webinar Series', desc: 'Bi-weekly webinar series demonstrating legacy CRM migration and security compliance.', type: 'WEBINAR', status: 'ACTIVE', budget: 12000.00, startDays: -14, endDays: 45 },
      { name: 'Executive ABM Outbound H2', desc: 'Targeted account-based marketing campaign to CTOs and VP Eng in top 500 logistics firms.', type: 'DIRECT_OUTBOUND', status: 'ACTIVE', budget: 18500.00, startDays: -45, endDays: 60 },
      { name: 'Cybersecurity Leaders Roundtable', desc: 'Closed-door roundtable for CISOs on zero-trust CRM data security architectures.', type: 'EVENT', status: 'PLANNING', budget: 8500.00, startDays: 15, endDays: 45 }
    ];

    const seededCampaigns = [];
    for (const cmp of campaignsData) {
      let existing = await prisma.campaign.findFirst({
        where: { organizationId: org.id, name: cmp.name }
      });
      if (!existing) {
        existing = await prisma.campaign.create({
          data: {
            organizationId: org.id,
            createdById: marketingUser.id,
            name: cmp.name,
            description: cmp.desc,
            type: cmp.type,
            status: cmp.status,
            budget: cmp.budget,
            startDate: new Date(Date.now() + cmp.startDays * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + cmp.endDays * 24 * 60 * 60 * 1000)
          }
        });
      }
      seededCampaigns.push(existing);
    }

    // Link Leads to Campaigns
    if (seededCampaigns.length > 0 && seededLeads.length > 0) {
      const c1 = seededCampaigns[0];
      const c2 = seededCampaigns[1];
      const linkPairs = [
        { c: c1, l: seededLeads[3] },
        { c: c2, l: seededLeads[4] },
        { c: c2, l: seededLeads[5] },
        { c: c1, l: seededLeads[0] }
      ];
      for (const pair of linkPairs) {
        if (pair.l) {
          await prisma.campaignLead.upsert({
            where: { campaignId_leadId: { campaignId: pair.c.id, leadId: pair.l.id } },
            update: {},
            create: { campaignId: pair.c.id, leadId: pair.l.id }
          });
        }
      }
    }
    console.log(`   ✓ ${seededCampaigns.length} Marketing Campaigns ready`);

    // -------------------------------------------------------------
    // 12. RUN AUTOMATIC LEAD SCORING FOR ALL SEEDED LEADS
    // -------------------------------------------------------------
    console.log('⚡ Computing Server-Side Lead Scores for all Organization Leads...');
    const allOrgLeads = await prisma.lead.findMany({
      where: { organizationId: org.id, deletedAt: null }
    });

    let hotCount = 0;
    let warmCount = 0;
    let coolCount = 0;
    let coldCount = 0;

    for (const ld of allOrgLeads) {
      const evaluated = await leadScoringService.calculateAndPersistLeadScore(org.id, ld.id);
      if (evaluated.category === 'HOT') hotCount++;
      else if (evaluated.category === 'WARM') warmCount++;
      else if (evaluated.category === 'COOL') coolCount++;
      else coldCount++;
    }

    console.log(`   ✓ Scored ${allOrgLeads.length} leads: ${hotCount} HOT 🔥 | ${warmCount} WARM ☀️ | ${coolCount} COOL 🌤️ | ${coldCount} COLD ❄️`);
  }

  console.log('\n🎉 Enterprise Data Seeding Completed Successfully! Vynexa CRM is now fully populated.');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed-enterprise-data.ts') || process.argv[1]?.endsWith('seed-enterprise-data.js')) {
  seedEnterpriseData()
    .catch((err) => {
      console.error('Fatal error during enterprise data seeding:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
