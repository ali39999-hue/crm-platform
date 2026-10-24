import { describe, expect, it, beforeEach } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FilesService, MAX_FILE_SIZE_BYTES } from './files.service.js';
import { FilesController } from './files.controller.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import type { UserContext } from '../../common/auth/auth.types.js';

describe('Files Module & Upload Workflow (Task F4-05)', () => {
  let filesService: FilesService;
  let filesController: FilesController;
  let auditService: AuditService;
  let outboxService: OutboxService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const employeeAlpha: UserContext = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'sarah@alphacorp.internal',
    displayName: 'Sarah Connor',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Corp',
      slug: 'alpha-corp',
      role: 'Employee',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Corp',
        role: 'Employee',
        active: true,
      },
    ],
  };

  const customerAlpha: UserContext = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'john@acmeclient.com',
    displayName: 'John Doe',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Corp',
      slug: 'alpha-corp',
      role: 'CustomerPortalUser',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Corp',
        role: 'CustomerPortalUser',
        active: true,
      },
    ],
  };

  const userBeta: UserContext = {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'alice@betaindustries.internal',
    displayName: 'Alice Smith',
    activeOrganization: {
      id: orgBeta,
      name: 'Beta Industries',
      slug: 'beta-ind',
      role: 'Employee',
    },
    memberships: [
      {
        organizationId: orgBeta,
        organizationName: 'Beta Industries',
        role: 'Employee',
        active: true,
      },
    ],
  };

  beforeEach(() => {
    auditService = new AuditService();
    outboxService = new OutboxService();
    filesService = new FilesService(auditService, outboxService);
    filesController = new FilesController(filesService);
  });

  describe('1. File Upload Intent & Validation', () => {
    it('creates upload intent for allowed MIME types (PDF, images, spreadsheets, docs, text)', () => {
      const allowedTypes = [
        { mime: 'application/pdf', name: 'contract.pdf' },
        { mime: 'image/png', name: 'diagram.png' },
        { mime: 'image/jpeg', name: 'photo.jpg' },
        { mime: 'text/csv', name: 'contacts.csv' },
        {
          mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          name: 'budget.xlsx',
        },
        {
          mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          name: 'memo.docx',
        },
        { mime: 'text/plain', name: 'notes.txt' },
      ];

      for (const item of allowedTypes) {
        const intent = filesService.createUploadIntent(employeeAlpha, {
          fileName: item.name,
          fileSize: 1024 * 50,
          mimeType: item.mime,
        });

        expect(intent.file.id).toBeDefined();
        expect(intent.file.status).toBe('PENDING_SCAN');
        expect(intent.uploadUrl).toBeDefined();
        expect(intent.uploadToken).toBeDefined();
        expect(intent.expiresAt).toBeDefined();
      }
    });

    it('rejects disallowed MIME types (e.g. executables, scripts, html)', () => {
      const disallowedTypes = [
        'application/x-msdownload',
        'application/javascript',
        'application/x-sh',
        'text/html',
        'application/octet-stream',
      ];

      for (const mime of disallowedTypes) {
        expect(() =>
          filesService.createUploadIntent(employeeAlpha, {
            fileName: 'payload.exe',
            fileSize: 1024,
            mimeType: mime,
          }),
        ).toThrow(BadRequestException);
      }
    });

    it('enforces strict 10MB size limit checks', () => {
      // Valid 10MB exact
      const valid = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'max-size.pdf',
        fileSize: MAX_FILE_SIZE_BYTES,
        mimeType: 'application/pdf',
      });
      expect(valid.file.fileSize).toBe(MAX_FILE_SIZE_BYTES);

      // Exceeds 10MB limit by 1 byte
      expect(() =>
        filesService.createUploadIntent(employeeAlpha, {
          fileName: 'oversized.pdf',
          fileSize: MAX_FILE_SIZE_BYTES + 1,
          mimeType: 'application/pdf',
        }),
      ).toThrow(BadRequestException);

      // Rejects 0 or negative size
      expect(() =>
        filesService.createUploadIntent(employeeAlpha, {
          fileName: 'empty.pdf',
          fileSize: 0,
          mimeType: 'application/pdf',
        }),
      ).toThrow(BadRequestException);
    });

    it('sanitizes malicious file names (directory traversal, special chars)', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: '../../../../etc/passwd',
        fileSize: 500,
        mimeType: 'text/plain',
      });

      expect(intent.file.fileName).not.toContain('..');
      expect(intent.file.fileName).not.toContain('/');
      expect(intent.file.fileName).toBe('passwd');
    });

    it('records audit events and outbox messages on upload intent', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'spec.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
      });

      const auditEvents = auditService.getEvents(orgAlpha);
      expect(auditEvents.some((e) => e.action === 'FILE_UPLOAD_INTENT_CREATED')).toBe(true);

      const outboxEvents = outboxService.getEvents(orgAlpha);
      expect(outboxEvents.some((e) => e.eventType === 'FileUploadIntentCreated')).toBe(true);
    });
  });

  describe('2. Quarantining & Malware Scan Workflow', () => {
    it('blocks download URL generation and download while file status is PENDING_SCAN', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'pending.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
      });

      // Pending scan cannot get signed download URL
      expect(() =>
        filesService.generateDownloadUrl(employeeAlpha, intent.file.id),
      ).toThrow(ForbiddenException);
    });

    it('blocks download URL generation and download when file status is REJECTED', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'infected.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
      });

      // Mark as rejected
      filesService.updateScanResult(
        employeeAlpha,
        intent.file.id,
        'REJECTED',
        'Trojan.Generic detected',
      );

      expect(() =>
        filesService.generateDownloadUrl(employeeAlpha, intent.file.id),
      ).toThrow(ForbiddenException);
    });

    it('allows signed download URL generation once file is VERIFIED', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'clean.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
      });

      // Mark as verified
      const updated = filesService.updateScanResult(
        employeeAlpha,
        intent.file.id,
        'VERIFIED',
        'ClamAV Clean',
      );
      expect(updated.status).toBe('VERIFIED');

      const signedUrl = filesService.generateDownloadUrl(
        employeeAlpha,
        intent.file.id,
      );
      expect(signedUrl.downloadUrl).toContain('/download?token=');
      expect(signedUrl.downloadToken).toBeDefined();
    });
  });

  describe('3. Signed Download Tokens & Expiration', () => {
    it('verifies valid signed download token', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'report.pdf',
        fileSize: 2000,
        mimeType: 'application/pdf',
      });
      filesService.updateScanResult(employeeAlpha, intent.file.id, 'VERIFIED');

      const signed = filesService.generateDownloadUrl(
        employeeAlpha,
        intent.file.id,
        900,
      );

      const verifiedFile = filesService.verifyDownloadToken(
        intent.file.id,
        signed.downloadToken,
      );
      expect(verifiedFile.id).toBe(intent.file.id);
      expect(verifiedFile.fileName).toBe('report.pdf');
    });

    it('rejects tampered or forged download tokens', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'statement.pdf',
        fileSize: 2000,
        mimeType: 'application/pdf',
      });
      filesService.updateScanResult(employeeAlpha, intent.file.id, 'VERIFIED');

      const signed = filesService.generateDownloadUrl(
        employeeAlpha,
        intent.file.id,
      );

      // Tamper signature
      const tampered = signed.downloadToken.slice(0, -5) + 'abcde';
      expect(() =>
        filesService.verifyDownloadToken(intent.file.id, tampered),
      ).toThrow(UnauthorizedException);

      // Completely invalid token
      expect(() =>
        filesService.verifyDownloadToken(intent.file.id, 'invalid.token'),
      ).toThrow(UnauthorizedException);
    });

    it('rejects expired download tokens', async () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'quick-expire.pdf',
        fileSize: 2000,
        mimeType: 'application/pdf',
      });
      filesService.updateScanResult(employeeAlpha, intent.file.id, 'VERIFIED');

      // Create token that expires in -1 second (already expired)
      const signed = filesService.generateDownloadUrl(
        employeeAlpha,
        intent.file.id,
        -1,
      );

      expect(() =>
        filesService.verifyDownloadToken(intent.file.id, signed.downloadToken),
      ).toThrow(UnauthorizedException);
    });

    it('rejects token when fileId does not match token fileId', () => {
      const intent1 = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'file1.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
      });
      const intent2 = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'file2.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
      });
      filesService.updateScanResult(employeeAlpha, intent1.file.id, 'VERIFIED');
      filesService.updateScanResult(employeeAlpha, intent2.file.id, 'VERIFIED');

      const signed1 = filesService.generateDownloadUrl(
        employeeAlpha,
        intent1.file.id,
      );

      // Attempt to use token for file1 to download file2
      expect(() =>
        filesService.verifyDownloadToken(intent2.file.id, signed1.downloadToken),
      ).toThrow(UnauthorizedException);
    });
  });

  describe('4. Strict Tenant Isolation', () => {
    it('prevents user in Organization Beta from accessing Organization Alpha files', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'alpha-confidential.pdf',
        fileSize: 5000,
        mimeType: 'application/pdf',
      });
      filesService.updateScanResult(employeeAlpha, intent.file.id, 'VERIFIED');

      // User from Org Beta cannot view metadata
      expect(() =>
        filesService.getFile(userBeta, intent.file.id),
      ).toThrow(NotFoundException);

      // User from Org Beta cannot generate signed download URL
      expect(() =>
        filesService.generateDownloadUrl(userBeta, intent.file.id),
      ).toThrow(NotFoundException);

      // User from Org Beta cannot update scan result
      expect(() =>
        filesService.updateScanResult(userBeta, intent.file.id, 'REJECTED'),
      ).toThrow(NotFoundException);
    });

    it('filters listFiles strictly by active organization', () => {
      filesService.createUploadIntent(employeeAlpha, {
        fileName: 'alpha1.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
      });
      filesService.createUploadIntent(userBeta, {
        fileName: 'beta1.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
      });

      const alphaFiles = filesService.listFiles(employeeAlpha);
      expect(alphaFiles.length).toBe(1);
      expect(alphaFiles[0]!.fileName).toBe('alpha1.pdf');

      const betaFiles = filesService.listFiles(userBeta);
      expect(betaFiles.length).toBe(1);
      expect(betaFiles[0]!.fileName).toBe('beta1.pdf');
    });
  });

  describe('5. Permission Checks (view_internal_tasks)', () => {
    it('blocks CustomerPortalUser from viewing or downloading internal attachments', () => {
      // Internal file created by employee
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'internal-brief.docx',
        fileSize: 4000,
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        visibility: 'INTERNAL',
      });
      filesService.updateScanResult(employeeAlpha, intent.file.id, 'VERIFIED');

      // Employee can access
      expect(filesService.getFile(employeeAlpha, intent.file.id)).toBeDefined();
      expect(
        filesService.generateDownloadUrl(employeeAlpha, intent.file.id),
      ).toBeDefined();

      // CustomerPortalUser lacks 'view_internal_tasks' permission -> ForbiddenException
      expect(() =>
        filesService.getFile(customerAlpha, intent.file.id),
      ).toThrow(ForbiddenException);

      expect(() =>
        filesService.generateDownloadUrl(customerAlpha, intent.file.id),
      ).toThrow(ForbiddenException);
    });

    it('permits CustomerPortalUser to access customer-shared attachments once verified', () => {
      const intent = filesService.createUploadIntent(employeeAlpha, {
        fileName: 'user-guide.pdf',
        fileSize: 4000,
        mimeType: 'application/pdf',
        visibility: 'CUSTOMER_SHARED',
      });
      filesService.updateScanResult(employeeAlpha, intent.file.id, 'VERIFIED');

      // CustomerPortalUser can access customer-shared file
      const file = filesService.getFile(customerAlpha, intent.file.id);
      expect(file).toBeDefined();
      expect(file.visibility).toBe('CUSTOMER_SHARED');

      const download = filesService.generateDownloadUrl(
        customerAlpha,
        intent.file.id,
      );
      expect(download.downloadUrl).toBeDefined();
    });

    it('omits internal files from listFiles for CustomerPortalUser', () => {
      filesService.createUploadIntent(employeeAlpha, {
        fileName: 'internal.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        visibility: 'INTERNAL',
      });
      filesService.createUploadIntent(employeeAlpha, {
        fileName: 'public-brochure.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        visibility: 'CUSTOMER_SHARED',
      });

      const customerFiles = filesService.listFiles(customerAlpha);
      expect(customerFiles.length).toBe(1);
      expect(customerFiles[0]!.fileName).toBe('public-brochure.pdf');
    });
  });

  describe('6. Controller Integration', () => {
    it('executes download endpoint with valid signed token and sets download headers', async () => {
      const intent = await filesController.createUploadIntent(employeeAlpha, {
        fileName: 'invoice.pdf',
        fileSize: 1234,
        mimeType: 'application/pdf',
      });

      await filesController.updateScanResult(employeeAlpha, intent.file.id, {
        status: 'VERIFIED',
      });

      const signed = await filesController.getSignedDownloadUrl(
        employeeAlpha,
        intent.file.id,
        {},
      );

      const headers: Record<string, string> = {};
      let statusCode = 0;
      let responseBody = '';

      const resMock: any = {
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
        status: (code: number) => {
          statusCode = code;
          return {
            send: (body: string) => {
              responseBody = body;
            },
          };
        },
      };

      await filesController.downloadFile(
        intent.file.id,
        signed.downloadToken,
        resMock,
      );

      expect(statusCode).toBe(200);
      expect(headers['Content-Disposition']).toBe(
        'attachment; filename="invoice.pdf"',
      );
      expect(headers['Content-Type']).toBe('application/pdf');
      expect(headers['Content-Length']).toBe('1234');
      expect(headers['X-File-Status']).toBe('VERIFIED');
      expect(responseBody).toContain('BINARY DATA FOR invoice.pdf');
    });
  });
});
