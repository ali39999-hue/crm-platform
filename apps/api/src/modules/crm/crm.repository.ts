import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { LeadStatus } from '@crm/domain';
import type {
  DealProductItemDto,
  ProductCatalogItemDto,
  ProformaInvoiceDto,
} from '@crm/contracts';

export type AccountEntity = {
  id: string;
  organizationId: string;
  ownerId: string | null;
  name: string;
  type: string;
  status: string;
  website: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactEntity = {
  id: string;
  organizationId: string;
  accountId: string | null;
  ownerId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadEntity = {
  id: string;
  organizationId: string;
  ownerId: string | null;
  accountId: string | null;
  convertedContactId: string | null;
  convertedDealId: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type DealEntity = {
  id: string;
  organizationId: string;
  accountId: string | null;
  ownerId: string | null;
  name: string;
  stage: string;
  amountMinor: number | null;
  currency: string | null;
  probability: number | null;
  targetCloseAt: string | null;
  lossReason?: string | null | undefined;
  lossDescription?: string | null | undefined;
  lostAt?: string | null | undefined;
  nextActionTitle?: string | null | undefined;
  nextActionDueAt?: string | null | undefined;
  stageUpdatedAt?: string | null | undefined;
  products?: DealProductItemDto[] | null | undefined;
  createdAt: string;
  updatedAt: string;
};

export interface ICrmRepository {
  /* Accounts */
  findAccounts(organizationId: string): Promise<AccountEntity[]>;
  findAccountById(organizationId: string, id: string): Promise<AccountEntity | null>;
  createAccount(data: Omit<AccountEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountEntity>;
  updateAccount(account: AccountEntity): Promise<AccountEntity>;
  deleteAccount(organizationId: string, id: string): Promise<boolean>;

  /* Contacts */
  findContacts(organizationId: string, accountId?: string): Promise<ContactEntity[]>;
  findContactById(organizationId: string, id: string): Promise<ContactEntity | null>;
  createContact(data: Omit<ContactEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactEntity>;
  updateContact(contact: ContactEntity): Promise<ContactEntity>;
  deleteContact(organizationId: string, id: string): Promise<boolean>;

  /* Leads */
  findLeads(organizationId: string): Promise<LeadEntity[]>;
  findLeadById(organizationId: string, id: string): Promise<LeadEntity | null>;
  createLead(data: Omit<LeadEntity, 'id' | 'createdAt' | 'updatedAt' | 'convertedContactId' | 'convertedDealId'>): Promise<LeadEntity>;
  updateLead(lead: LeadEntity): Promise<LeadEntity>;
  deleteLead(organizationId: string, id: string): Promise<boolean>;

  /* Deals */
  findDeals(organizationId: string, accountId?: string): Promise<DealEntity[]>;
  findDealById(organizationId: string, id: string): Promise<DealEntity | null>;
  createDeal(data: Omit<DealEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealEntity>;
  updateDeal(deal: DealEntity): Promise<DealEntity>;
  deleteDeal(organizationId: string, id: string): Promise<boolean>;

  /* Products */
  findProducts(organizationId: string): Promise<ProductCatalogItemDto[]>;
  createProduct(
    organizationId: string,
    data: Omit<ProductCatalogItemDto, 'id' | 'organizationId'>,
  ): Promise<ProductCatalogItemDto>;

  /* Invoices */
  findInvoices(organizationId: string, dealId?: string): Promise<ProformaInvoiceDto[]>;
  createInvoice(
    organizationId: string,
    data: Omit<ProformaInvoiceDto, 'id' | 'organizationId' | 'createdAt'>,
  ): Promise<ProformaInvoiceDto>;
}

@Injectable()
export class InMemoryCrmRepository implements ICrmRepository {
  private accounts: Map<string, AccountEntity> = new Map();
  private contacts: Map<string, ContactEntity> = new Map();
  private leads: Map<string, LeadEntity> = new Map();
  private deals: Map<string, DealEntity> = new Map();
  private products: Map<string, ProductCatalogItemDto> = new Map();
  private invoices: Map<string, ProformaInvoiceDto> = new Map();

  constructor() {
    this.seedDefaultCrmData();
  }

  private seedDefaultCrmData() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';

    // Seed Accounts
    const accAlphaId = '50000000-0000-0000-0000-000000000001';
    this.accounts.set(accAlphaId, {
      id: accAlphaId,
      organizationId: orgAlpha,
      ownerId: employeeAlpha,
      name: 'فولاد گستر آریا',
      type: 'ENTERPRISE',
      status: 'ACTIVE',
      website: 'https://foolad-arya.com',
      phone: '02188990011',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const accBetaId = '50000000-0000-0000-0000-000000000002';
    this.accounts.set(accBetaId, {
      id: accBetaId,
      organizationId: orgBeta,
      ownerId: null,
      name: 'سازمان بتا پارتنر',
      type: 'COMPANY',
      status: 'ACTIVE',
      website: 'https://beta-org.com',
      phone: '02177665544',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Contacts
    const contactId = '60000000-0000-0000-0000-000000000001';
    this.contacts.set(contactId, {
      id: contactId,
      organizationId: orgAlpha,
      accountId: accAlphaId,
      ownerId: employeeAlpha,
      firstName: 'محمد',
      lastName: 'رضایی',
      email: 'm.rezaei@foolad-arya.com',
      phone: '09121234567',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Leads
    const leadId = '70000000-0000-0000-0000-000000000001';
    this.leads.set(leadId, {
      id: leadId,
      organizationId: orgAlpha,
      ownerId: employeeAlpha,
      accountId: null,
      convertedContactId: null,
      convertedDealId: null,
      displayName: 'علیرضا حسینی - شرکت داده‌ورز',
      email: 'hosseini@dadevarz.com',
      phone: '09129876543',
      source: 'WEBSITE',
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Deals (including Didar next action and rotting deal patterns)
    const dealId = '80000000-0000-0000-0000-000000000001';
    this.deals.set(dealId, {
      id: dealId,
      organizationId: orgAlpha,
      accountId: accAlphaId,
      ownerId: employeeAlpha,
      name: 'قرارداد توسعه نرم‌افزار سالانه فولاد گستر',
      stage: 'PROPOSAL',
      amountMinor: 350000000,
      currency: 'IRR',
      probability: 70,
      targetCloseAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      nextActionTitle: 'جلسه دمو و ارائه پروپوزال فنی به مدیریت ارشد',
      nextActionDueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      stageUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const dealRottingId = '80000000-0000-0000-0000-000000000002';
    const twentyDaysAgo = new Date(Date.now() - 86400000 * 20).toISOString();
    this.deals.set(dealRottingId, {
      id: dealRottingId,
      organizationId: orgAlpha,
      accountId: accAlphaId,
      ownerId: employeeAlpha,
      name: 'تجهیز شبکه و کابل‌کشی انبار مرکزی فولاد',
      stage: 'NEED_ANALYSIS',
      amountMinor: 180000000,
      currency: 'IRR',
      probability: 40,
      targetCloseAt: new Date(Date.now() + 86400000 * 10).toISOString(),
      stageUpdatedAt: twentyDaysAgo,
      createdAt: twentyDaysAgo,
      updatedAt: twentyDaysAgo,
    });

    // Seed Products Catalog
    const prod1Id = '90000000-0000-0000-0000-000000000001';
    this.products.set(prod1Id, {
      id: prod1Id,
      organizationId: orgAlpha,
      sku: 'CRM-ENT-YEARLY',
      name: 'نرم‌افزار مدیریت ارتباط با مشتری سازمانی (لایسنس سالانه)',
      unit: 'کاربر/سال',
      unitPriceMinor: 120000000,
      currency: 'IRR',
      taxRatePercent: 10,
      active: true,
    });

    const prod2Id = '90000000-0000-0000-0000-000000000002';
    this.products.set(prod2Id, {
      id: prod2Id,
      organizationId: orgAlpha,
      sku: 'CRM-DEPLOY-ONBOARDING',
      name: 'بسته جامع استقرار، شخصی‌سازی کاریزها و آموزش تیم فروش',
      unit: 'پروژه',
      unitPriceMinor: 50000000,
      currency: 'IRR',
      taxRatePercent: 10,
      active: true,
    });

    const prod3Id = '90000000-0000-0000-0000-000000000003';
    this.products.set(prod3Id, {
      id: prod3Id,
      organizationId: orgAlpha,
      sku: 'SUPPORT-VIP-ANNUAL',
      name: 'پشتیبانی اختصاصی و راهبری فنی VIP',
      unit: 'سالانه',
      unitPriceMinor: 30000000,
      currency: 'IRR',
      taxRatePercent: 10,
      active: true,
    });
  }

  /* Accounts */
  async findAccounts(organizationId: string): Promise<AccountEntity[]> {
    return Array.from(this.accounts.values()).filter((a) => a.organizationId === organizationId);
  }

  async findAccountById(organizationId: string, id: string): Promise<AccountEntity | null> {
    const acc = this.accounts.get(id);
    if (!acc || acc.organizationId !== organizationId) return null;
    return acc;
  }

  async createAccount(data: Omit<AccountEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountEntity> {
    const id = randomUUID();
    const entity: AccountEntity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.accounts.set(id, entity);
    return entity;
  }

  async updateAccount(account: AccountEntity): Promise<AccountEntity> {
    const updated = { ...account, updatedAt: new Date().toISOString() };
    this.accounts.set(account.id, updated);
    return updated;
  }

  /* Contacts */
  async findContacts(organizationId: string, accountId?: string): Promise<ContactEntity[]> {
    return Array.from(this.contacts.values()).filter(
      (c) => c.organizationId === organizationId && (!accountId || c.accountId === accountId),
    );
  }

  async findContactById(organizationId: string, id: string): Promise<ContactEntity | null> {
    const contact = this.contacts.get(id);
    if (!contact || contact.organizationId !== organizationId) return null;
    return contact;
  }

  async createContact(data: Omit<ContactEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactEntity> {
    const id = randomUUID();
    const entity: ContactEntity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contacts.set(id, entity);
    return entity;
  }

  async updateContact(contact: ContactEntity): Promise<ContactEntity> {
    const updated = { ...contact, updatedAt: new Date().toISOString() };
    this.contacts.set(contact.id, updated);
    return updated;
  }

  /* Leads */
  async findLeads(organizationId: string): Promise<LeadEntity[]> {
    return Array.from(this.leads.values()).filter((l) => l.organizationId === organizationId);
  }

  async findLeadById(organizationId: string, id: string): Promise<LeadEntity | null> {
    const lead = this.leads.get(id);
    if (!lead || lead.organizationId !== organizationId) return null;
    return lead;
  }

  async createLead(data: Omit<LeadEntity, 'id' | 'createdAt' | 'updatedAt' | 'convertedContactId' | 'convertedDealId'>): Promise<LeadEntity> {
    const id = randomUUID();
    const entity: LeadEntity = {
      ...data,
      id,
      convertedContactId: null,
      convertedDealId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leads.set(id, entity);
    return entity;
  }

  async updateLead(lead: LeadEntity): Promise<LeadEntity> {
    const updated = { ...lead, updatedAt: new Date().toISOString() };
    this.leads.set(lead.id, updated);
    return updated;
  }

  /* Deals */
  async findDeals(organizationId: string, accountId?: string): Promise<DealEntity[]> {
    return Array.from(this.deals.values()).filter(
      (d) => d.organizationId === organizationId && (!accountId || d.accountId === accountId),
    );
  }

  async findDealById(organizationId: string, id: string): Promise<DealEntity | null> {
    const deal = this.deals.get(id);
    if (!deal || deal.organizationId !== organizationId) return null;
    return deal;
  }

  async createDeal(data: Omit<DealEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DealEntity> {
    const id = randomUUID();
    const entity: DealEntity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.deals.set(id, entity);
    return entity;
  }

  async updateDeal(deal: DealEntity): Promise<DealEntity> {
    const updated = { ...deal, updatedAt: new Date().toISOString() };
    this.deals.set(deal.id, updated);
    return updated;
  }

  async deleteAccount(organizationId: string, id: string): Promise<boolean> {
    const acc = this.accounts.get(id);
    if (!acc || acc.organizationId !== organizationId) return false;
    this.accounts.delete(id);
    return true;
  }

  async deleteContact(organizationId: string, id: string): Promise<boolean> {
    const con = this.contacts.get(id);
    if (!con || con.organizationId !== organizationId) return false;
    this.contacts.delete(id);
    return true;
  }

  async deleteLead(organizationId: string, id: string): Promise<boolean> {
    const lead = this.leads.get(id);
    if (!lead || lead.organizationId !== organizationId) return false;
    this.leads.delete(id);
    return true;
  }

  async deleteDeal(organizationId: string, id: string): Promise<boolean> {
    const deal = this.deals.get(id);
    if (!deal || deal.organizationId !== organizationId) return false;
    this.deals.delete(id);
    return true;
  }

  /* Products */
  async findProducts(organizationId: string): Promise<ProductCatalogItemDto[]> {
    return Array.from(this.products.values()).filter((p) => p.organizationId === organizationId);
  }

  async createProduct(
    organizationId: string,
    data: Omit<ProductCatalogItemDto, 'id' | 'organizationId'>,
  ): Promise<ProductCatalogItemDto> {
    const id = randomUUID();
    const entity: ProductCatalogItemDto = {
      ...data,
      id,
      organizationId,
    };
    this.products.set(id, entity);
    return entity;
  }

  /* Invoices */
  async findInvoices(organizationId: string, dealId?: string): Promise<ProformaInvoiceDto[]> {
    return Array.from(this.invoices.values()).filter(
      (inv) => inv.organizationId === organizationId && (!dealId || inv.dealId === dealId),
    );
  }

  async createInvoice(
    organizationId: string,
    data: Omit<ProformaInvoiceDto, 'id' | 'organizationId' | 'createdAt'>,
  ): Promise<ProformaInvoiceDto> {
    const id = randomUUID();
    const entity: ProformaInvoiceDto = {
      ...data,
      id,
      organizationId,
      createdAt: new Date().toISOString(),
    };
    this.invoices.set(id, entity);
    return entity;
  }
}
