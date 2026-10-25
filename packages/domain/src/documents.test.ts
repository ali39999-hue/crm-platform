import { describe, it, expect } from 'vitest';
import {
  canAccessDocument,
  assertDocumentAccess,
  canEditDocument,
  sanitizeDocumentContent,
  generateSlug,
} from './documents.js';

describe('Document Access & Visibility Domain Rules', () => {
  describe('CustomerPortalUser isolation', () => {
    it('allows access only to published CUSTOMER_VISIBLE documents', () => {
      expect(canAccessDocument('CustomerPortalUser', 'CUSTOMER_VISIBLE', true)).toBe(true);
    });

    it('denies customer access to unpublished CUSTOMER_VISIBLE drafts', () => {
      expect(canAccessDocument('CustomerPortalUser', 'CUSTOMER_VISIBLE', false)).toBe(false);
    });

    it('strictly denies customer access to WORKSPACE, TEAM, and PRIVATE documents', () => {
      expect(canAccessDocument('CustomerPortalUser', 'WORKSPACE', true)).toBe(false);
      expect(canAccessDocument('CustomerPortalUser', 'TEAM', true)).toBe(false);
      expect(canAccessDocument('CustomerPortalUser', 'PRIVATE', true)).toBe(false);
    });

    it('assertDocumentAccess throws descriptive Persian error for unauthorized customer', () => {
      expect(() => {
        assertDocumentAccess('CustomerPortalUser', 'WORKSPACE', true);
      }).toThrow('محدودیت دسترسی: دسترسی به اسناد داخلی برای کاربران پورتال مشتریان مجاز نیست');
    });
  });

  describe('Internal Staff Access', () => {
    it('allows workspace staff to access WORKSPACE and TEAM documents', () => {
      expect(canAccessDocument('Employee', 'WORKSPACE', false)).toBe(true);
      expect(canAccessDocument('Manager', 'TEAM', true)).toBe(true);
      expect(canAccessDocument('Sales', 'WORKSPACE', true)).toBe(true);
    });

    it('restricts PRIVATE documents to author or admins', () => {
      // Author can access
      expect(canAccessDocument('Employee', 'PRIVATE', false, true)).toBe(true);
      // Non-author staff cannot access private doc
      expect(canAccessDocument('Employee', 'PRIVATE', false, false)).toBe(false);
      // Admin can access private doc for oversight
      expect(canAccessDocument('OrganizationAdmin', 'PRIVATE', false, false)).toBe(true);
      expect(canAccessDocument('SystemOwner', 'PRIVATE', false, false)).toBe(true);
    });
  });

  describe('Document Editing Permissions', () => {
    it('denies edit permissions to CustomerPortalUser and Auditor', () => {
      expect(canEditDocument('CustomerPortalUser', 'CUSTOMER_VISIBLE')).toBe(false);
      expect(canEditDocument('Auditor', 'WORKSPACE')).toBe(false);
    });

    it('allows edit permissions for internal staff on non-private documents', () => {
      expect(canEditDocument('Employee', 'WORKSPACE')).toBe(true);
      expect(canEditDocument('Manager', 'TEAM')).toBe(true);
      expect(canEditDocument('OrganizationAdmin', 'PRIVATE')).toBe(true);
    });
  });

  describe('Content Sanitization & Slug generation', () => {
    it('removes script tags and inline event handlers to prevent XSS', () => {
      const malicious = '<script>alert("hacked")</script>متن مستند با عکس <img src="x" onerror="alert(1)"> و لینک';
      const clean = sanitizeDocumentContent(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert(');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('متن مستند با عکس');
    });

    it('generates a clean slug preserving Persian and English characters', () => {
      const slug = generateSlug('راهنمای فنی سیستم CRM نسخه ۲.۰');
      expect(slug).toContain('راهنمای-فنی-سیستم-crm-نسخه-۲-۰');
    });
  });
});
