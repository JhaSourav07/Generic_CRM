import { createTestOrg } from '../factories/org.factory.js';
import { createTestRole } from '../factories/role.factory.js';
import { createTestUser } from '../factories/user.factory.js';

export async function setupMultiTenantFixtures() {
  // Create Organization A
  const orgA = await createTestOrg({ name: 'Organization Alpha', slug: 'org-alpha' });
  const roleAdminA = await createTestRole({ organizationId: orgA.id, name: 'SALES_MANAGER' });
  const userA = await createTestUser({
    organizationId: orgA.id,
    roleId: roleAdminA.id,
    name: 'User Alpha',
    email: 'user.alpha@org-a.com'
  });

  // Create Organization B
  const orgB = await createTestOrg({ name: 'Organization Beta', slug: 'org-beta' });
  const roleAdminB = await createTestRole({ organizationId: orgB.id, name: 'SALES_MANAGER' });
  const userB = await createTestUser({
    organizationId: orgB.id,
    roleId: roleAdminB.id,
    name: 'User Beta',
    email: 'user.beta@org-b.com'
  });

  return { orgA, userA, roleAdminA, orgB, userB, roleAdminB };
}
