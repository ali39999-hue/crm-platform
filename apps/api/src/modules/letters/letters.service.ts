import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  generateIndicatorNumber,
  canDeleteLetter,
  canDeleteParaff,
} from '@crm/domain';
import type {
  CreateLetterRequest,
  CreateParaffRequest,
  LetterDto,
  LetterParaffDto,
  ReferLetterRequest,
} from '@crm/contracts';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class LettersService {
  // In-memory store: organizationId -> Map<letterId, LetterDto>
  private lettersByOrg: Map<string, Map<string, LetterDto>> = new Map();
  private seqCounterByOrg: Map<string, number> = new Map();

  constructor(private readonly auditService: AuditService) {}

  private getOrgStore(orgId: string): Map<string, LetterDto> {
    if (!this.lettersByOrg.has(orgId)) {
      this.lettersByOrg.set(orgId, new Map());
    }
    return this.lettersByOrg.get(orgId)!;
  }

  private getNextSequence(orgId: string): number {
    const current = this.seqCounterByOrg.get(orgId) || 0;
    const next = current + 1;
    this.seqCounterByOrg.set(orgId, next);
    return next;
  }

  async createLetter(
    organizationId: string,
    senderId: string,
    senderName: string,
    senderRole: string,
    dto: CreateLetterRequest,
    requestId?: string,
  ): Promise<LetterDto> {
    const store = this.getOrgStore(organizationId);
    const seq = this.getNextSequence(organizationId);

    // Current Jalali or calendar year for secretariat (default 1405 for Persian corporate year)
    const indicatorNumber = generateIndicatorNumber({
      year: 1405,
      secretariatCode: 'SEC',
      sequenceNumber: seq,
    });

    const now = new Date().toISOString();
    const letterId = randomUUID();

    const letter: LetterDto = {
      id: letterId,
      organizationId,
      indicatorNumber,
      letterType: dto.letterType,
      subject: dto.subject.trim(),
      content: dto.content.trim(),
      urgency: dto.urgency || 'NORMAL',
      classification: dto.classification || 'NORMAL',
      status: 'SENT',
      senderId,
      senderName,
      recipientIds: dto.recipientIds,
      ccIds: dto.ccIds || [],
      isRead: false,
      attachmentUrls: dto.attachmentUrls || [],
      paraffs: [],
      createdAt: now,
      updatedAt: now,
    };

    store.set(letterId, letter);

    this.auditService.record({
      organizationId,
      actorId: senderId,
      action: 'LETTER_CREATED',
      entityType: 'LETTER',
      entityId: letterId,
      requestId,
      metadata: { indicatorNumber, subject: letter.subject, type: letter.letterType },
    });

    return letter;
  }

  async listLetters(
    organizationId: string,
    userId: string,
    mailbox?: 'inbox' | 'sent' | 'all',
  ): Promise<LetterDto[]> {
    const store = this.getOrgStore(organizationId);
    const all = Array.from(store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (mailbox === 'sent') {
      return all.filter((l) => l.senderId === userId);
    }
    if (mailbox === 'inbox') {
      return all.filter(
        (l) => l.recipientIds.includes(userId) || (l.ccIds && l.ccIds.includes(userId)),
      );
    }
    return all.filter(
      (l) =>
        l.senderId === userId ||
        l.recipientIds.includes(userId) ||
        (l.ccIds && l.ccIds.includes(userId)),
    );
  }

  async getLetterById(
    organizationId: string,
    actorId: string,
    letterId: string,
  ): Promise<LetterDto> {
    const store = this.getOrgStore(organizationId);
    const letter = store.get(letterId);
    if (!letter) {
      throw new NotFoundException(`نامه با شناسه «${letterId}» یافت نشد.`);
    }

    // Mark as read if actor is one of the recipients
    const isRecipient =
      letter.recipientIds.includes(actorId) || (letter.ccIds && letter.ccIds.includes(actorId));

    if (isRecipient && !letter.isRead) {
      letter.isRead = true;
      letter.readAt = new Date().toISOString();
      letter.status = 'RECEIVED';
      letter.updatedAt = new Date().toISOString();
    }

    return letter;
  }

  async deleteLetter(
    organizationId: string,
    actorId: string,
    actorRole: string,
    letterId: string,
    requestId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const store = this.getOrgStore(organizationId);
    const letter = store.get(letterId);
    if (!letter) {
      throw new NotFoundException(`نامه با شناسه «${letterId}» یافت نشد.`);
    }

    const allowed = canDeleteLetter(
      { id: actorId, role: actorRole },
      { senderId: letter.senderId, isRead: letter.isRead },
    );

    if (!allowed) {
      throw new ForbiddenException(
        'طبق قوانین اتوماسیون میزیتو، نامه پس از رویت توسط مخاطب قابل حذف نیست (مگر توسط مدیر میزکار برای نامه‌های خود).',
      );
    }

    store.delete(letterId);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'LETTER_DELETED',
      entityType: 'LETTER',
      entityId: letterId,
      requestId,
      metadata: { indicatorNumber: letter.indicatorNumber },
    });

    return { success: true, message: 'نامه با موفقیت حذف گردید.' };
  }

  async referLetter(
    organizationId: string,
    actorId: string,
    actorName: string,
    letterId: string,
    dto: ReferLetterRequest,
    requestId?: string,
  ): Promise<LetterDto> {
    const store = this.getOrgStore(organizationId);
    const letter = store.get(letterId);
    if (!letter) {
      throw new NotFoundException(`نامه با شناسه «${letterId}» یافت نشد.`);
    }

    if (!letter.recipientIds.includes(dto.recipientId)) {
      letter.recipientIds.push(dto.recipientId);
    }

    const paraffText = `[ارجاع توسط ${actorName}]: ${dto.actionInstruction}${
      dto.deadlineAt ? ` (مهلت اقدام: ${dto.deadlineAt})` : ''
    }`;

    await this.addParaff(organizationId, actorId, actorName, letterId, {
      text: paraffText,
    });

    letter.updatedAt = new Date().toISOString();

    this.auditService.record({
      organizationId,
      actorId,
      action: 'LETTER_REFERRED',
      entityType: 'LETTER',
      entityId: letterId,
      requestId,
      metadata: { referredTo: dto.recipientId, instruction: dto.actionInstruction },
    });

    return letter;
  }

  async addParaff(
    organizationId: string,
    authorId: string,
    authorName: string,
    letterId: string,
    dto: CreateParaffRequest,
    requestId?: string,
  ): Promise<LetterParaffDto> {
    const store = this.getOrgStore(organizationId);
    const letter = store.get(letterId);
    if (!letter) {
      throw new NotFoundException(`نامه با شناسه «${letterId}» یافت نشد.`);
    }

    const paraff: LetterParaffDto = {
      id: randomUUID(),
      letterId,
      authorId,
      authorName,
      text: dto.text.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (!letter.paraffs) {
      letter.paraffs = [];
    }
    letter.paraffs.push(paraff);
    letter.updatedAt = new Date().toISOString();

    this.auditService.record({
      organizationId,
      actorId: authorId,
      action: 'LETTER_PARAFF_ADDED',
      entityType: 'LETTER',
      entityId: letterId,
      requestId,
      metadata: { paraffId: paraff.id },
    });

    return paraff;
  }

  async deleteParaff(
    organizationId: string,
    actorId: string,
    actorRole: string,
    letterId: string,
    paraffId: string,
    requestId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const store = this.getOrgStore(organizationId);
    const letter = store.get(letterId);
    if (!letter) {
      throw new NotFoundException(`نامه با شناسه «${letterId}» یافت نشد.`);
    }

    const paraffIndex = (letter.paraffs || []).findIndex((p) => p.id === paraffId);
    if (paraffIndex === -1) {
      throw new NotFoundException(`پاراف با شناسه «${paraffId}» یافت نشد.`);
    }

    const paraff = letter.paraffs![paraffIndex]!;
    const allowed = canDeleteParaff(
      { id: actorId, role: actorRole },
      { authorId: paraff.authorId, isRead: paraff.isRead },
    );

    if (!allowed) {
      throw new ForbiddenException(
        'طبق قوانین میزیتو، پاراف پس از رویت مخاطب قابل حذف نیست (مگر توسط مدیر میزکار برای پاراف‌های خود).',
      );
    }

    letter.paraffs!.splice(paraffIndex, 1);
    letter.updatedAt = new Date().toISOString();

    this.auditService.record({
      organizationId,
      actorId,
      action: 'LETTER_PARAFF_DELETED',
      entityType: 'LETTER',
      entityId: letterId,
      requestId,
      metadata: { paraffId },
    });

    return { success: true, message: 'پاراف با موفقیت حذف گردید.' };
  }
}
