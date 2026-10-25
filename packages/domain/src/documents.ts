import type { MembershipRole } from './permissions.js';

export const DOCUMENT_VISIBILITIES = [
  'PRIVATE',
  'TEAM',
  'WORKSPACE',
  'CUSTOMER_VISIBLE',
] as const;

export type DocumentVisibility = (typeof DOCUMENT_VISIBILITIES)[number];

/**
 * Checks whether a user with a given role can view/read the document.
 */
export function canAccessDocument(
  role: MembershipRole,
  visibility: DocumentVisibility,
  isPublished: boolean,
  isAuthor = false,
): boolean {
  if (role === 'CustomerPortalUser') {
    // External customers can ONLY access published documents marked as CUSTOMER_VISIBLE
    return visibility === 'CUSTOMER_VISIBLE' && isPublished;
  }

  // System owners and organization admins have full visibility oversight
  if (role === 'SystemOwner' || role === 'OrganizationAdmin') {
    return true;
  }

  if (visibility === 'PRIVATE') {
    // Private documents are restricted to the author
    return isAuthor;
  }

  // TEAM, WORKSPACE, and CUSTOMER_VISIBLE are accessible to internal staff
  return true;
}

/**
 * Throws a descriptive domain error if the user role cannot access the document.
 */
export function assertDocumentAccess(
  role: MembershipRole,
  visibility: DocumentVisibility,
  isPublished: boolean,
  isAuthor = false,
): void {
  if (!canAccessDocument(role, visibility, isPublished, isAuthor)) {
    if (role === 'CustomerPortalUser') {
      throw new Error(
        'محدودیت دسترسی: دسترسی به اسناد داخلی برای کاربران پورتال مشتریان مجاز نیست',
      );
    }
    if (visibility === 'PRIVATE') {
      throw new Error(
        'محدودیت دسترسی: این سند خصوصی است و فقط توسط نویسنده یا مدیر سیستم قابل مشاهده است',
      );
    }
    throw new Error('محدودیت دسترسی: مشاهده این سند برای نقش شما مجاز نیست');
  }
}

/**
 * Checks whether a user can create or edit a document.
 */
export function canEditDocument(
  role: MembershipRole,
  visibility: DocumentVisibility,
  isAuthor = false,
): boolean {
  if (role === 'CustomerPortalUser' || role === 'Auditor') {
    return false;
  }

  if (role === 'SystemOwner' || role === 'OrganizationAdmin') {
    return true;
  }

  if (visibility === 'PRIVATE') {
    return isAuthor;
  }

  return true;
}

/**
 * Sanitizes markdown / rich text content to prevent stored XSS attacks
 * while preserving valid markdown elements and text formatting.
 */
export function sanitizeDocumentContent(raw: string): string {
  if (!raw) return '';

  return raw
    // Strip <script>...</script>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip <iframe>...</iframe>
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Strip <object>, <embed>, <applet>
    .replace(/<(object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Strip inline event handlers like onclick=, onerror=, onload=, etc.
    .replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Strip javascript: pseudo-protocols in links/src
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'src=""');
}

/**
 * Generates an SEO & URL-friendly slug from title, supporting Persian script.
 */
export function generateSlug(title: string): string {
  if (!title) return '';

  return title
    .trim()
    .toLowerCase()
    .replace(/[._]/g, '-')
    .replace(/[^؀-ۿa-z0-9\s-]/g, '') // Keep Persian letters, Latin letters, digits, whitespace, and hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
