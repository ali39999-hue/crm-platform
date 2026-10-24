import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import path from 'path';
import { isActionAllowed } from '@crm/domain';
import type {
  FileDto,
  FileScanStatus,
  FileVisibility,
  SignedDownloadResponse,
  UploadIntentResponse,
} from '@crm/contracts';
import type { UserContext } from '../../common/auth/auth.types.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import type { CreateUploadIntentDto } from './dto/upload-intent.dto.js';

export const ALLOWED_MIME_TYPES = [
  // PDF
  'application/pdf',
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Spreadsheets
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Docs
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Text
  'text/plain',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const DEFAULT_DOWNLOAD_EXPIRY_SECONDS = 15 * 60; // 15 minutes

interface SignedTokenPayload {
  fileId: string;
  organizationId: string;
  action: 'download' | 'upload';
  expiresAt: number; // ms timestamp
  nonce: string;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly files = new Map<string, FileDto>();
  private readonly signingSecret: string;

  constructor(
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {
    this.signingSecret =
      process.env.FILE_SIGNING_SECRET ||
      'crm-production-hmac-file-signing-key-secret-32b';
  }

  clear(): void {
    this.files.clear();
  }

  seedFile(file: FileDto): void {
    this.files.set(file.id, file);
  }

  createUploadIntent(
    user: UserContext,
    dto: CreateUploadIntentDto,
  ): UploadIntentResponse {
    // 1. Strict Size Limit Check
    if (!dto.fileSize || dto.fileSize <= 0) {
      throw new BadRequestException('File size must be greater than 0 bytes');
    }
    if (dto.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size (${dto.fileSize} bytes) exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES} bytes (10MB)`,
      );
    }

    // 2. Allowed MIME Types Allowlist Check
    const normalizedMime = dto.mimeType?.toLowerCase().trim();
    if (!normalizedMime || !ALLOWED_MIME_TYPES.includes(normalizedMime as any)) {
      throw new BadRequestException(
        `MIME type '${dto.mimeType}' is not allowed. Supported types: PDF, Images, Spreadsheets, Docs, and Plain Text.`,
      );
    }

    // 3. File Name Sanitization
    const sanitizedFileName = this.sanitizeFileName(dto.fileName);
    if (!sanitizedFileName) {
      throw new BadRequestException('Invalid file name');
    }

    const fileId = randomUUID();
    const organizationId = user.activeOrganization.id;
    const visibility: FileVisibility = dto.visibility ?? 'INTERNAL';
    const storageKey = `orgs/${organizationId}/files/${fileId}/${sanitizedFileName}`;
    const nowIso = new Date().toISOString();

    const fileRecord: FileDto = {
      id: fileId,
      organizationId,
      uploaderId: user.id,
      fileName: sanitizedFileName,
      fileSize: dto.fileSize,
      mimeType: normalizedMime,
      visibility,
      status: 'PENDING_SCAN', // Quarantined by default
      storageKey,
      scanDetails: null,
      associatedEntityType: dto.associatedEntityType ?? null,
      associatedEntityId: dto.associatedEntityId ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.files.set(fileId, fileRecord);

    const expiresAtMs = Date.now() + DEFAULT_DOWNLOAD_EXPIRY_SECONDS * 1000;
    const uploadToken = this.generateToken({
      fileId,
      organizationId,
      action: 'upload',
      expiresAt: expiresAtMs,
      nonce: randomBytes(8).toString('hex'),
    });

    const uploadUrl = `/api/v1/files/${fileId}/upload?token=${uploadToken}`;

    // Audit & Outbox
    this.auditService.record({
      organizationId,
      actorId: user.id,
      action: 'FILE_UPLOAD_INTENT_CREATED',
      entityType: 'File',
      entityId: fileId,
      metadata: {
        fileName: sanitizedFileName,
        fileSize: dto.fileSize,
        mimeType: normalizedMime,
        visibility,
        status: 'PENDING_SCAN',
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'FileUploadIntentCreated',
      aggregateType: 'File',
      aggregateId: fileId,
      payload: {
        fileId,
        fileName: sanitizedFileName,
        fileSize: dto.fileSize,
        mimeType: normalizedMime,
        visibility,
        storageKey,
      },
    });

    return {
      file: fileRecord,
      uploadUrl,
      uploadToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  updateScanResult(
    user: UserContext,
    fileId: string,
    status: 'VERIFIED' | 'REJECTED',
    scanDetails?: string,
  ): FileDto {
    const file = this.files.get(fileId);
    if (!file || file.organizationId !== user.activeOrganization.id) {
      throw new NotFoundException(`File with ID '${fileId}' not found`);
    }

    file.status = status;
    file.scanDetails = scanDetails ?? (status === 'VERIFIED' ? 'Clean scan' : 'Malware threat detected');
    file.updatedAt = new Date().toISOString();

    this.files.set(fileId, file);

    this.auditService.record({
      organizationId: user.activeOrganization.id,
      actorId: user.id,
      action: 'FILE_SCAN_COMPLETED',
      entityType: 'File',
      entityId: fileId,
      metadata: {
        status,
        scanDetails: file.scanDetails,
      },
    });

    this.outboxService.emit({
      organizationId: user.activeOrganization.id,
      eventType: 'FileScanCompleted',
      aggregateType: 'File',
      aggregateId: fileId,
      payload: {
        fileId,
        status,
        scanDetails: file.scanDetails,
      },
    });

    return file;
  }

  generateDownloadUrl(
    user: UserContext,
    fileId: string,
    expiresInSec: number = DEFAULT_DOWNLOAD_EXPIRY_SECONDS,
  ): SignedDownloadResponse {
    const file = this.files.get(fileId);

    // Strict Tenant Isolation
    if (!file || file.organizationId !== user.activeOrganization.id) {
      throw new NotFoundException(`File with ID '${fileId}' not found`);
    }

    // Permission Check: Internal attachments require 'view_internal_tasks'
    if (file.visibility === 'INTERNAL') {
      const allowed = isActionAllowed(
        user.activeOrganization.role as any,
        'view_internal_tasks',
      );
      if (!allowed) {
        throw new ForbiddenException(
          `Permission denied: role '${user.activeOrganization.role}' is not permitted to access internal attachments`,
        );
      }
    }

    // Quarantining Status Check
    if (file.status === 'REJECTED') {
      throw new ForbiddenException(
        `Access denied: file '${file.fileName}' was rejected during security scan`,
      );
    }
    if (file.status === 'PENDING_SCAN') {
      throw new ForbiddenException(
        `Access denied: file '${file.fileName}' is in quarantine pending malware scan`,
      );
    }

    const expiresAtMs = Date.now() + expiresInSec * 1000;
    const downloadToken = this.generateToken({
      fileId,
      organizationId: user.activeOrganization.id,
      action: 'download',
      expiresAt: expiresAtMs,
      nonce: randomBytes(8).toString('hex'),
    });

    const downloadUrl = `/api/v1/files/${fileId}/download?token=${downloadToken}`;

    this.auditService.record({
      organizationId: user.activeOrganization.id,
      actorId: user.id,
      action: 'FILE_SIGNED_URL_GENERATED',
      entityType: 'File',
      entityId: fileId,
      metadata: {
        fileName: file.fileName,
        expiresInSec,
      },
    });

    return {
      fileId,
      fileName: file.fileName,
      downloadUrl,
      downloadToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  verifyDownloadToken(fileId: string, token: string): FileDto {
    const payload = this.verifyToken(token);

    if (payload.action !== 'download') {
      throw new UnauthorizedException('Token is not authorized for file download');
    }

    if (payload.fileId !== fileId) {
      throw new UnauthorizedException('Token file ID mismatch');
    }

    if (Date.now() > payload.expiresAt) {
      throw new UnauthorizedException('Signed download link has expired');
    }

    const file = this.files.get(fileId);
    if (!file || file.organizationId !== payload.organizationId) {
      throw new NotFoundException(`File with ID '${fileId}' not found`);
    }

    if (file.status === 'REJECTED') {
      throw new ForbiddenException(
        `Access denied: file was rejected during security scan`,
      );
    }
    if (file.status === 'PENDING_SCAN') {
      throw new ForbiddenException(
        `Access denied: file is currently quarantined pending malware verification`,
      );
    }

    return file;
  }

  getFile(user: UserContext, fileId: string): FileDto {
    const file = this.files.get(fileId);
    if (!file || file.organizationId !== user.activeOrganization.id) {
      throw new NotFoundException(`File with ID '${fileId}' not found`);
    }

    if (file.visibility === 'INTERNAL') {
      const allowed = isActionAllowed(
        user.activeOrganization.role as any,
        'view_internal_tasks',
      );
      if (!allowed) {
        throw new ForbiddenException(
          `Permission denied: role '${user.activeOrganization.role}' is not permitted to view internal attachments`,
        );
      }
    }

    return file;
  }

  listFiles(
    user: UserContext,
    filter?: { entityType?: string; entityId?: string },
  ): FileDto[] {
    const orgId = user.activeOrganization.id;
    const canViewInternal = isActionAllowed(
      user.activeOrganization.role as any,
      'view_internal_tasks',
    );

    return Array.from(this.files.values()).filter((f) => {
      if (f.organizationId !== orgId) return false;
      if (!canViewInternal && f.visibility === 'INTERNAL') return false;
      if (filter?.entityType && f.associatedEntityType !== filter.entityType)
        return false;
      if (filter?.entityId && f.associatedEntityId !== filter.entityId)
        return false;
      return true;
    });
  }

  private sanitizeFileName(original: string): string {
    const base = path.basename(original || '').trim();
    // Strip dangerous characters, control characters, path delimiters
    const cleaned = base.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return cleaned.slice(0, 200);
  }

  private generateToken(payload: SignedTokenPayload): string {
    const dataString = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.signingSecret)
      .update(dataString)
      .digest('base64url');
    return `${dataString}.${signature}`;
  }

  private verifyToken(token: string): SignedTokenPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Signed token is required');
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Malformed signed token');
    }

    const dataString = parts[0];
    const signature = parts[1];
    if (!dataString || !signature) {
      throw new UnauthorizedException('Malformed signed token');
    }
    const expectedSignature = createHmac('sha256', this.signingSecret)
      .update(dataString)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid or tampered signed token');
    }

    try {
      const json = Buffer.from(dataString, 'base64url').toString('utf8');
      return JSON.parse(json) as SignedTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid token payload encoding');
    }
  }
}
