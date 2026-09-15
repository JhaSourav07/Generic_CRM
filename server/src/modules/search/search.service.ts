import { PrismaClient } from '@prisma/client';
import { AuthContext, hasPermission } from '../../utils/rbac.js';

const prisma = new PrismaClient();

export interface SearchResultItem {
  id: string;
  entityType:
    | 'lead'
    | 'customer'
    | 'contact'
    | 'opportunity'
    | 'task'
    | 'activity'
    | 'quote'
    | 'order'
    | 'support_case'
    | 'campaign'
    | 'product';
  title: string;
  subtitle: string;
  status?: string;
  url: string;
  createdAt: string;
}

export interface GroupedSearchResults {
  leads: SearchResultItem[];
  customers: SearchResultItem[];
  contacts: SearchResultItem[];
  opportunities: SearchResultItem[];
  tasks: SearchResultItem[];
  activities: SearchResultItem[];
  quotes: SearchResultItem[];
  orders: SearchResultItem[];
  support_cases: SearchResultItem[];
  campaigns: SearchResultItem[];
  products: SearchResultItem[];
}

export interface SearchResponseData {
  query: string;
  totalMatches: number;
  results: SearchResultItem[];
  grouped: GroupedSearchResults;
}

export class SearchService {
  /**
   * Search across all authorized CRM entities within the tenant organization.
   */
  public async search(
    context: AuthContext,
    searchTerm: string,
    limitPerEntity = 5
  ): Promise<SearchResponseData> {
    const q = searchTerm.trim();
    const orgId = context.organizationId;

    // Check permissions in parallel for all entity domains
    const [
      canViewLeads,
      canViewAccounts,
      canViewContacts,
      canViewOpportunities,
      canViewTasks,
      canViewActivities,
      canViewQuotes,
      canViewOrders,
      canViewSupport,
      canViewCampaigns,
      canViewProducts
    ] = await Promise.all([
      hasPermission(context, 'leads', 'VIEW'),
      hasPermission(context, 'accounts', 'VIEW'),
      hasPermission(context, 'contacts', 'VIEW'),
      hasPermission(context, 'opportunities', 'VIEW'),
      hasPermission(context, 'tasks', 'VIEW'),
      hasPermission(context, 'activities', 'VIEW'),
      hasPermission(context, 'quotes', 'VIEW'),
      hasPermission(context, 'orders', 'VIEW'),
      hasPermission(context, 'support_cases', 'VIEW'),
      hasPermission(context, 'campaigns', 'VIEW'),
      hasPermission(context, 'products', 'VIEW')
    ]);

    // Build query promises only for permitted entity domains
    const queryPromises: Promise<any>[] = [
      // 1. Leads
      canViewLeads
        ? prisma.lead.findMany({
            where: {
              organizationId: orgId,
              deletedAt: null,
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { company: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
              email: true,
              status: true,
              createdAt: true
            }
          })
        : Promise.resolve([]),

      // 2. Customers / Accounts
      canViewAccounts
        ? prisma.account.findMany({
            where: {
              organizationId: orgId,
              deletedAt: null,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { industry: { contains: q, mode: 'insensitive' } },
                { website: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              industry: true,
              status: true,
              createdAt: true
            }
          })
        : Promise.resolve([]),

      // 3. Contacts
      canViewContacts
        ? prisma.contact.findMany({
            where: {
              organizationId: orgId,
              deletedAt: null,
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              jobTitle: true,
              createdAt: true,
              account: {
                select: { name: true }
              }
            }
          })
        : Promise.resolve([]),

      // 4. Opportunities
      canViewOpportunities
        ? prisma.opportunity.findMany({
            where: {
              organizationId: orgId,
              deletedAt: null,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              value: true,
              status: true,
              createdAt: true,
              account: { select: { name: true } },
              stage: { select: { name: true } }
            }
          })
        : Promise.resolve([]),

      // 5. Tasks
      canViewTasks
        ? prisma.task.findMany({
            where: {
              organizationId: orgId,
              deletedAt: null,
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              createdAt: true
            }
          })
        : Promise.resolve([]),

      // 6. Activities
      canViewActivities
        ? prisma.activity.findMany({
            where: {
              organizationId: orgId,
              OR: [
                { subject: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              subject: true,
              type: true,
              activityDate: true,
              createdAt: true
            }
          })
        : Promise.resolve([]),

      // 7. Quotes
      canViewQuotes
        ? prisma.quote.findMany({
            where: {
              organizationId: orgId,
              OR: [
                { quoteNumber: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              quoteNumber: true,
              status: true,
              total: true,
              createdAt: true,
              account: { select: { name: true } }
            }
          })
        : Promise.resolve([]),

      // 8. Orders
      canViewOrders
        ? prisma.order.findMany({
            where: {
              organizationId: orgId,
              OR: [
                { orderNumber: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true,
              account: { select: { name: true } }
            }
          })
        : Promise.resolve([]),

      // 9. Support Cases
      canViewSupport
        ? prisma.supportCase.findMany({
            where: {
              organizationId: orgId,
              deletedAt: null,
              OR: [
                { subject: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              subject: true,
              status: true,
              priority: true,
              createdAt: true,
              account: { select: { name: true } }
            }
          })
        : Promise.resolve([]),

      // 10. Campaigns
      canViewCampaigns
        ? prisma.campaign.findMany({
            where: {
              organizationId: orgId,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              status: true,
              type: true,
              createdAt: true
            }
          })
        : Promise.resolve([]),

      // 11. Products
      canViewProducts
        ? prisma.product.findMany({
            where: {
              organizationId: orgId,
              deletedAt: null,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
              ]
            },
            take: limitPerEntity,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              currency: true,
              isActive: true,
              createdAt: true
            }
          })
        : Promise.resolve([])
    ];

    const [
      rawLeads,
      rawAccounts,
      rawContacts,
      rawOpportunities,
      rawTasks,
      rawActivities,
      rawQuotes,
      rawOrders,
      rawSupport,
      rawCampaigns,
      rawProducts
    ] = await Promise.all(queryPromises);

    // Transform and map to standardized SearchResultItem
    const leads: SearchResultItem[] = rawLeads.map((l: any) => ({
      id: l.id,
      entityType: 'lead',
      title: `${l.firstName} ${l.lastName}`.trim() + (l.company ? ` (${l.company})` : ''),
      subtitle: l.email || l.company || 'Lead prospect',
      status: l.status,
      url: `/app/leads/${l.id}`,
      createdAt: l.createdAt.toISOString()
    }));

    const customers: SearchResultItem[] = rawAccounts.map((a: any) => ({
      id: a.id,
      entityType: 'customer',
      title: a.name,
      subtitle: a.industry ? `${a.industry} • Customer Account` : 'Customer Account',
      status: a.status,
      url: `/app/customers/${a.id}`,
      createdAt: a.createdAt.toISOString()
    }));

    const contacts: SearchResultItem[] = rawContacts.map((c: any) => ({
      id: c.id,
      entityType: 'contact',
      title: `${c.firstName} ${c.lastName}`.trim(),
      subtitle: c.account?.name
        ? `${c.account.name}${c.jobTitle ? ` • ${c.jobTitle}` : ''}`
        : c.email || c.jobTitle || 'Contact',
      status: undefined,
      url: `/app/contacts/${c.id}`,
      createdAt: c.createdAt.toISOString()
    }));

    const opportunities: SearchResultItem[] = rawOpportunities.map((o: any) => ({
      id: o.id,
      entityType: 'opportunity',
      title: o.name,
      subtitle: `${o.account?.name ? `${o.account.name} • ` : ''}${o.stage?.name || 'Stage'} • $${Number(o.value).toLocaleString()}`,
      status: o.status,
      url: `/app/opportunities/${o.id}`,
      createdAt: o.createdAt.toISOString()
    }));

    const tasks: SearchResultItem[] = rawTasks.map((t: any) => ({
      id: t.id,
      entityType: 'task',
      title: t.title,
      subtitle: `Priority: ${t.priority}${t.dueDate ? ` • Due ${new Date(t.dueDate).toLocaleDateString()}` : ''}`,
      status: t.status,
      url: `/app/tasks`,
      createdAt: t.createdAt.toISOString()
    }));

    const activities: SearchResultItem[] = rawActivities.map((act: any) => ({
      id: act.id,
      entityType: 'activity',
      title: act.subject,
      subtitle: `${act.type} • ${new Date(act.activityDate).toLocaleDateString()}`,
      status: act.type,
      url: `/app/activities`,
      createdAt: act.createdAt.toISOString()
    }));

    const quotes: SearchResultItem[] = rawQuotes.map((qItem: any) => ({
      id: qItem.id,
      entityType: 'quote',
      title: `Quote #${qItem.quoteNumber}`,
      subtitle: `${qItem.account?.name ? `${qItem.account.name} • ` : ''}Total: $${Number(qItem.total).toLocaleString()}`,
      status: qItem.status,
      url: `/app/quotes/${qItem.id}`,
      createdAt: qItem.createdAt.toISOString()
    }));

    const orders: SearchResultItem[] = rawOrders.map((ord: any) => ({
      id: ord.id,
      entityType: 'order',
      title: `Order #${ord.orderNumber}`,
      subtitle: `${ord.account?.name ? `${ord.account.name} • ` : ''}Total: $${Number(ord.total).toLocaleString()}`,
      status: ord.status,
      url: `/app/orders/${ord.id}`,
      createdAt: ord.createdAt.toISOString()
    }));

    const support_cases: SearchResultItem[] = rawSupport.map((sc: any) => ({
      id: sc.id,
      entityType: 'support_case',
      title: sc.subject,
      subtitle: `${sc.account?.name ? `${sc.account.name} • ` : ''}Priority: ${sc.priority}`,
      status: sc.status,
      url: `/app/support-cases/${sc.id}`,
      createdAt: sc.createdAt.toISOString()
    }));

    const campaigns: SearchResultItem[] = rawCampaigns.map((camp: any) => ({
      id: camp.id,
      entityType: 'campaign',
      title: camp.name,
      subtitle: camp.type ? `${camp.type} • Campaign` : 'Marketing Campaign',
      status: camp.status,
      url: `/app/campaigns/${camp.id}`,
      createdAt: camp.createdAt.toISOString()
    }));

    const products: SearchResultItem[] = rawProducts.map((p: any) => ({
      id: p.id,
      entityType: 'product',
      title: p.name,
      subtitle: `${p.sku ? `SKU: ${p.sku} • ` : ''}${p.currency} $${Number(p.price).toLocaleString()}`,
      status: p.isActive ? 'ACTIVE' : 'INACTIVE',
      url: `/app/products/${p.id}`,
      createdAt: p.createdAt.toISOString()
    }));

    const grouped: GroupedSearchResults = {
      leads,
      customers,
      contacts,
      opportunities,
      tasks,
      activities,
      quotes,
      orders,
      support_cases,
      campaigns,
      products
    };

    // Flatten all results
    const results: SearchResultItem[] = [
      ...leads,
      ...customers,
      ...contacts,
      ...opportunities,
      ...quotes,
      ...orders,
      ...tasks,
      ...activities,
      ...support_cases,
      ...campaigns,
      ...products
    ];

    return {
      query: q,
      totalMatches: results.length,
      results,
      grouped
    };
  }
}

export const searchService = new SearchService();
