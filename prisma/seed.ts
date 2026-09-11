import { PrismaClient, LeadStatus, OpportunityStatus, ProductType } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // Safe sha256 hashing helper for development seed data
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting Vynexa CRM Database Seeding...');

  // 1. Seed Demo Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      email: 'contact@acme.com',
      phone: '+1 (555) 019-2834',
      website: 'https://acme.com',
      timezone: 'America/New_York',
      currency: 'USD'
    }
  });
  console.log(`✅ Seeded Organization: ${org.name} (${org.id})`);

  // 2. Seed System Roles
  const roleNames = [
    { name: 'SUPER_ADMIN', desc: 'Full tenant control, organization management, system settings, audit oversight.' },
    { name: 'SALES_MANAGER', desc: 'Pipeline management, team assignments, quote approvals, team reporting.' },
    { name: 'SALES_REPRESENTATIVE', desc: 'Individual lead management, opportunity pipeline, activity tracking, personal tasks.' },
    { name: 'MARKETING_MANAGER', desc: 'Lead ingestion, campaign tracking, target audience management.' },
    { name: 'SUPPORT_AGENT', desc: 'Support cases, SLA resolution, customer contacts, ticket activities.' },
    { name: 'OPERATIONS_FINANCE', desc: 'Order processing, catalog management, invoicing/quote auditing.' },
    { name: 'EXECUTIVE', desc: 'Read-only executive reports, analytics, high-level dashboards.' }
  ];

  const rolesMap = new Map<string, string>();
  for (const r of roleNames) {
    const role = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: r.name
        }
      },
      update: { description: r.desc },
      create: {
        organizationId: org.id,
        name: r.name,
        description: r.desc
      }
    });
    rolesMap.set(r.name, role.id);
  }
  console.log(`✅ Seeded ${rolesMap.size} System Roles`);

  // 3. Seed Resource Permissions
  const resources = [
    'leads', 'accounts', 'contacts', 'opportunities', 'pipelines',
    'quotes', 'orders', 'products', 'activities', 'tasks',
    'documents', 'support_cases', 'campaigns', 'reports',
    'users', 'roles', 'settings', 'audit_logs'
  ];
  const actions = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'APPROVE', 'EXPORT'];

  const createdPermissions: { id: string; resource: string; action: string }[] = [];
  for (const resource of resources) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: {
          resource_action: { resource, action }
        },
        update: {},
        create: {
          resource,
          action,
          description: `Permission to ${action} ${resource}`
        }
      });
      createdPermissions.push(perm);
    }
  }
  console.log(`✅ Seeded ${createdPermissions.length} System Permissions`);

  // 4. Link RolePermissions for SUPER_ADMIN (All permissions)
  const superAdminRoleId = rolesMap.get('SUPER_ADMIN')!;
  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRoleId,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: superAdminRoleId,
        permissionId: perm.id
      }
    });
  }

  // 5. Seed Demo Users
  const passwordHash = hashPassword('super-secret-admin-password-change-in-production');

  const superAdminUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'admin@vynexa.com'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      roleId: superAdminRoleId,
      name: 'Alex Vance (Super Admin)',
      email: 'admin@vynexa.com',
      passwordHash,
      isActive: true
    }
  });

  const salesManagerRoleId = rolesMap.get('SALES_MANAGER')!;
  const salesManagerUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'sales.manager@acme.com'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      roleId: salesManagerRoleId,
      name: 'Sarah Connor (Sales Manager)',
      email: 'sales.manager@acme.com',
      passwordHash,
      isActive: true
    }
  });

  const salesRepRoleId = rolesMap.get('SALES_REPRESENTATIVE')!;
  const salesRepUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'sales.rep@acme.com'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      roleId: salesRepRoleId,
      name: 'Dave Miller (Sales Rep)',
      email: 'sales.rep@acme.com',
      passwordHash,
      isActive: true
    }
  });
  console.log(`✅ Seeded Users: ${superAdminUser.email}, ${salesManagerUser.email}, ${salesRepUser.email}`);

  // 6. Seed Default Sales Pipeline & Stages
  const pipeline = await prisma.pipeline.create({
    data: {
      organizationId: org.id,
      name: 'Standard Sales Pipeline',
      description: 'Default commercial deal pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'Qualification', order: 1, probability: 0.2 },
          { name: 'Value Proposal', order: 2, probability: 0.4 },
          { name: 'Negotiation', order: 3, probability: 0.7 },
          { name: 'Closed Won', order: 4, probability: 1.0 },
          { name: 'Closed Lost', order: 5, probability: 0.0 }
        ]
      }
    }
  });

  const pipelineStages = await prisma.pipelineStage.findMany({
    where: { pipelineId: pipeline.id },
    orderBy: { order: 'asc' }
  });
  console.log(`✅ Seeded Default Pipeline with ${pipelineStages.length} Stages`);

  // 7. Seed Products & Services Catalog
  const prod1 = await prisma.product.upsert({
    where: {
      organizationId_sku: {
        organizationId: org.id,
        sku: 'VYN-ENT-01'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Vynexa Enterprise SaaS License',
      sku: 'VYN-ENT-01',
      description: 'Annual enterprise multi-tenant software license',
      type: ProductType.PRODUCT,
      price: 12000.00,
      currency: 'USD',
      isActive: true
    }
  });

  const prod2 = await prisma.product.upsert({
    where: {
      organizationId_sku: {
        organizationId: org.id,
        sku: 'VYN-SRV-ONB'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Implementation & Onboarding Package',
      sku: 'VYN-SRV-ONB',
      description: 'Professional onboarding, integration, and admin training',
      type: ProductType.SERVICE,
      price: 4500.00,
      currency: 'USD',
      isActive: true
    }
  });
  console.log(`✅ Seeded Catalog Items: ${prod1.name}, ${prod2.name}`);

  // 8. Seed Demo Lead, Account, Contact, and Opportunity
  const lead = await prisma.lead.create({
    data: {
      organizationId: org.id,
      ownerId: salesRepUser.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@starlight.com',
      company: 'Starlight Solutions',
      phone: '+1 (555) 987-6543',
      source: 'Inbound Webform',
      status: LeadStatus.QUALIFIED,
      score: 85,
      notes: 'High intent prospect interested in enterprise tier.'
    }
  });

  const account = await prisma.account.create({
    data: {
      organizationId: org.id,
      ownerId: salesRepUser.id,
      name: 'Starlight Solutions Inc.',
      industry: 'Software & Technology',
      website: 'https://starlight.example.com',
      email: 'info@starlight.example.com',
      status: 'ACTIVE'
    }
  });

  const contact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      accountId: account.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@starlight.com',
      phone: '+1 (555) 987-6543',
      jobTitle: 'VP of Engineering',
      department: 'Technology',
      isPrimary: true
    }
  });

  const proposalStage = pipelineStages.find(s => s.name === 'Value Proposal') || pipelineStages[1];

  const opportunity = await prisma.opportunity.create({
    data: {
      organizationId: org.id,
      accountId: account.id,
      contactId: contact.id,
      ownerId: salesRepUser.id,
      pipelineId: pipeline.id,
      stageId: proposalStage.id,
      name: 'Starlight Enterprise SaaS Deal',
      description: 'Annual enterprise agreement including professional onboarding',
      value: 16500.00,
      probability: 0.4,
      status: OpportunityStatus.OPEN,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  console.log(`✅ Seeded CRM Demo Records: Lead (${lead.id}), Account (${account.id}), Contact (${contact.id}), Opportunity (${opportunity.id})`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
