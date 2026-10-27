import { describe, expect, it, beforeEach } from 'vitest';
import { LettersService } from './letters.service.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('LettersService (Mizito Office Automation & Secretariat)', () => {
  let service: LettersService;
  const mockAuditService = {
    record: async () => {},
  } as any;

  beforeEach(() => {
    service = new LettersService(mockAuditService);
  });

  it('creates an outgoing letter with standardized indicator number and tenant isolation', async () => {
    const letter = await service.createLetter(
      'org-1',
      'user-1',
      'مدیر عامل',
      'OrganizationAdmin',
      {
        letterType: 'OUTGOING',
        subject: 'قرارداد همکاری تجاری',
        content: 'متن پیش‌نویس قرارداد همکاری رسمی ارسال می‌گردد.',
        recipientIds: ['user-2'],
      },
    );

    expect(letter.id).toBeDefined();
    expect(letter.indicatorNumber).toMatch(/^\d{4}\/SEC\/\d{4}$/);
    expect(letter.status).toBe('SENT');
    expect(letter.senderId).toBe('user-1');
    expect(letter.isRead).toBe(false);

    // Verify tenant isolation: org-2 cannot see it
    const org2Letters = await service.listLetters('org-2', 'user-2');
    expect(org2Letters).toHaveLength(0);

    const org1Letters = await service.listLetters('org-1', 'user-2', 'inbox');
    expect(org1Letters).toHaveLength(1);
    expect(org1Letters[0]!.id).toBe(letter.id);
  });

  it('marks letter as read when recipient views it', async () => {
    const letter = await service.createLetter(
      'org-1',
      'user-1',
      'علی مرادی',
      'MEMBER',
      {
        letterType: 'INTERNAL',
        subject: 'دعوت به نشست تخصصی',
        content: 'جلسه فردا ساعت ۱۰ برگزار خواهد شد.',
        recipientIds: ['user-2'],
      },
    );

    expect(letter.isRead).toBe(false);

    const viewed = await service.getLetterById('org-1', 'user-2', letter.id);
    expect(viewed.isRead).toBe(true);
    expect(viewed.readAt).toBeDefined();
  });

  it('enforces Mizito deletion rule: regular sender cannot delete read letter', async () => {
    const letter = await service.createLetter(
      'org-1',
      'user-1',
      'کارشناس اداری',
      'MEMBER',
      {
        letterType: 'INTERNAL',
        subject: 'ابلاغیه داخلی',
        content: 'دستورالعمل اداری جدید پیوست شد.',
        recipientIds: ['user-2'],
      },
    );

    // Recipient reads it
    await service.getLetterById('org-1', 'user-2', letter.id);

    // Regular member attempts to delete read letter -> ForbiddenException
    await expect(
      service.deleteLetter('org-1', 'user-1', 'MEMBER', letter.id),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows workspace admin to delete their own letter even after it is read', async () => {
    const letter = await service.createLetter(
      'org-1',
      'admin-1',
      'مدیر سیستم',
      'OrganizationAdmin',
      {
        letterType: 'INTERNAL',
        subject: 'اطلاعیه تغییر ساعت',
        content: 'ساعات کاری جدید اعمال شد.',
        recipientIds: ['user-2'],
      },
    );

    // Recipient reads it
    await service.getLetterById('org-1', 'user-2', letter.id);

    // Admin can delete their own letter even after being read
    const result = await service.deleteLetter('org-1', 'admin-1', 'OrganizationAdmin', letter.id);
    expect(result.success).toBe(true);
  });

  it('adds paraff to letter and handles paraff deletion rules', async () => {
    const letter = await service.createLetter(
      'org-1',
      'user-1',
      'کارشناس',
      'MEMBER',
      {
        letterType: 'INTERNAL',
        subject: 'درخواست خرید تجهیزات',
        content: 'تجهیزات مورد نیاز دپارتمان ارسال شد.',
        recipientIds: ['user-2'],
      },
    );

    const paraff = await service.addParaff(
      'org-1',
      'user-2',
      'مدیر مالی',
      letter.id,
      { text: 'بودجه تایید شد، جهت اقدام ارجاع گردد.' },
    );

    expect(paraff.id).toBeDefined();
    expect(paraff.text).toBe('بودجه تایید شد، جهت اقدام ارجاع گردد.');
    expect(paraff.isRead).toBe(false);

    // Author deletes unread paraff -> allowed
    const delResult = await service.deleteParaff(
      'org-1',
      'user-2',
      'MEMBER',
      letter.id,
      paraff.id,
    );
    expect(delResult.success).toBe(true);
  });
});
