import { Inject, Injectable } from '@nestjs/common';
import type { SearchResultDto, SearchResultItem } from '@crm/contracts';
import type { ITaskRepository } from '../tasks/task.repository.js';
import { InMemoryCrmRepository } from '../crm/crm.repository.js';
import { InMemorySupportRepository } from '../support/support.repository.js';

@Injectable()
export class SearchService {
  constructor(
    @Inject('TASK_REPOSITORY') private readonly taskRepo: ITaskRepository,
    private readonly crmRepo: InMemoryCrmRepository,
    private readonly supportRepo: InMemorySupportRepository,
  ) {}

  async search(
    organizationId: string,
    userRole: string,
    userId: string,
    q: string,
    entityTypes?: string[],
    limit?: number,
  ): Promise<SearchResultDto> {
    const rawQuery = q ?? '';
    const term = rawQuery.trim().toLowerCase();

    if (!term) {
      return {
        query: rawQuery,
        totalHits: 0,
        items: [],
      };
    }

    const isCustomerPortalUser = userRole === 'CustomerPortalUser';

    // Normalize requested entity types if provided
    let requestedSet: Set<string> | null = null;
    if (entityTypes && entityTypes.length > 0) {
      requestedSet = new Set(entityTypes.map((t) => t.trim().toUpperCase()));
    }

    const shouldSearch = (type: string): boolean => {
      if (isCustomerPortalUser) {
        // CustomerPortalUser CANNOT search Tasks, Accounts, Contacts, Leads.
        // Can only search their own Tickets.
        return type === 'TICKET' && (!requestedSet || requestedSet.has('TICKET'));
      }
      return !requestedSet || requestedSet.has(type);
    };

    const results: SearchResultItem[] = [];

    // 1. Tasks
    if (shouldSearch('TASK')) {
      const tasks = await this.taskRepo.findAll(organizationId, { limit: 1000 });
      for (const task of tasks) {
        if (task.organizationId !== organizationId) continue;
        const matchesTitle = task.title.toLowerCase().includes(term);
        const matchesKey = task.key.toLowerCase().includes(term);
        const matchesDesc = task.description?.toLowerCase().includes(term) ?? false;

        if (matchesTitle || matchesKey || matchesDesc) {
          results.push({
            id: task.id,
            entityType: 'TASK',
            title: task.title,
            subtitle: task.key,
            status: task.status,
            url: `/tasks/${task.id}`,
            createdAt: task.createdAt,
          });
        }
      }
    }

    // 2. Accounts
    if (shouldSearch('ACCOUNT')) {
      const accounts = await this.crmRepo.findAccounts(organizationId);
      for (const account of accounts) {
        if (account.organizationId !== organizationId) continue;
        const matchesName = account.name.toLowerCase().includes(term);
        const matchesPhone = account.phone?.toLowerCase().includes(term) ?? false;
        const matchesWebsite = account.website?.toLowerCase().includes(term) ?? false;
        const matchesType = account.type.toLowerCase().includes(term);

        if (matchesName || matchesPhone || matchesWebsite || matchesType) {
          results.push({
            id: account.id,
            entityType: 'ACCOUNT',
            title: account.name,
            subtitle: account.phone || account.website || account.type || null,
            status: account.status,
            url: `/crm/accounts/${account.id}`,
            createdAt: account.createdAt,
          });
        }
      }
    }

    // 3. Contacts
    if (shouldSearch('CONTACT')) {
      const contacts = await this.crmRepo.findContacts(organizationId);
      for (const contact of contacts) {
        if (contact.organizationId !== organizationId) continue;
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const matchesName =
          fullName.includes(term) ||
          contact.firstName.toLowerCase().includes(term) ||
          contact.lastName.toLowerCase().includes(term);
        const matchesEmail = contact.email?.toLowerCase().includes(term) ?? false;
        const matchesPhone = contact.phone?.toLowerCase().includes(term) ?? false;

        if (matchesName || matchesEmail || matchesPhone) {
          results.push({
            id: contact.id,
            entityType: 'CONTACT',
            title: `${contact.firstName} ${contact.lastName}`.trim(),
            subtitle: contact.email || contact.phone || null,
            status: null,
            url: `/crm/contacts/${contact.id}`,
            createdAt: contact.createdAt,
          });
        }
      }
    }

    // 4. Leads
    if (shouldSearch('LEAD')) {
      const leads = await this.crmRepo.findLeads(organizationId);
      for (const lead of leads) {
        if (lead.organizationId !== organizationId) continue;
        const matchesName = lead.displayName.toLowerCase().includes(term);
        const matchesEmail = lead.email?.toLowerCase().includes(term) ?? false;
        const matchesPhone = lead.phone?.toLowerCase().includes(term) ?? false;
        const matchesSource = lead.source?.toLowerCase().includes(term) ?? false;

        if (matchesName || matchesEmail || matchesPhone || matchesSource) {
          results.push({
            id: lead.id,
            entityType: 'LEAD',
            title: lead.displayName,
            subtitle: lead.email || lead.phone || lead.source || null,
            status: lead.status,
            url: `/crm/leads/${lead.id}`,
            createdAt: lead.createdAt,
          });
        }
      }
    }

    // 5. Tickets
    if (shouldSearch('TICKET')) {
      const tickets = await this.supportRepo.findTickets(organizationId);
      for (const ticket of tickets) {
        if (ticket.organizationId !== organizationId) continue;

        // Scoping for CustomerPortalUser: must be their own ticket
        if (isCustomerPortalUser) {
          const isOwned = await this.supportRepo.isTicketOwnedByUser(
            organizationId,
            ticket.id,
            userId,
          );
          if (!isOwned) {
            continue;
          }
        }

        const matchesTitle = ticket.title.toLowerCase().includes(term);
        const matchesRef = ticket.reference.toLowerCase().includes(term);

        if (matchesTitle || matchesRef) {
          results.push({
            id: ticket.id,
            entityType: 'TICKET',
            title: ticket.title,
            subtitle: ticket.reference,
            status: ticket.status,
            url: `/tickets/${ticket.id}`,
            createdAt: ticket.createdAt,
          });
        }
      }
    }

    // Sort by createdAt descending
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const totalHits = results.length;
    const effectiveLimit = limit && limit > 0 ? limit : 50;
    const items = results.slice(0, effectiveLimit);

    return {
      query: rawQuery,
      totalHits,
      items,
    };
  }
}
