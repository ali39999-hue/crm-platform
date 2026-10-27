import { describe, expect, it, beforeEach } from 'vitest';
import { MeetingsService } from './meetings.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MeetingsService (Mizito Digital Meeting Minutes & Resolutions)', () => {
  let service: MeetingsService;
  const mockAuditService = {
    record: async () => {},
  } as any;
  const mockTasksService = {
    createTask: async (_orgId: string, _actorId: string, dto: any) => ({
      id: 'task-gen-1',
      title: dto.title,
    }),
  } as any;

  beforeEach(() => {
    service = new MeetingsService(mockAuditService, mockTasksService);
  });

  it('creates digital meeting minutes with attendees and resolutions', async () => {
    const meeting = await service.createMeeting('org-1', 'user-1', {
      title: 'جلسه برنامه‌ریزی فصلی Q3',
      agenda: 'بررسی تارگت‌های فروش، اهداف پروژه و بهبود فرآیندها',
      startsAt: '2026-11-01T09:00:00Z',
      location: 'اتاق جلسات ۱ / آنلاین',
      attendees: [
        { userId: 'user-1', name: 'دبیر جلسه', role: 'SECRETARY' },
        { userId: 'user-2', name: 'مدیر فنی', role: 'MEMBER' },
        { userId: 'user-3', name: 'مشاور خارجی', role: 'GUEST' },
      ],
      resolutions: [
        {
          title: 'پیاده‌سازی ماژول کارتابل تا پایان هفته',
          assigneeId: 'user-2',
          dueAt: '2026-11-08T18:00:00Z',
        },
      ],
    });

    expect(meeting.id).toBeDefined();
    expect(meeting.attendees).toHaveLength(3);
    expect(meeting.attendees[0]!.signatureStatus).toBe('PENDING');
    expect(meeting.resolutions).toHaveLength(1);
    expect(meeting.resolutions[0]!.status).toBe('PENDING');

    // Tenant isolation
    const org2Meetings = await service.listMeetings('org-2');
    expect(org2Meetings).toHaveLength(0);
  });

  it('allows attendees to digitally sign or reject minutes', async () => {
    const meeting = await service.createMeeting('org-1', 'user-1', {
      title: 'جلسه بازبینی معماری',
      agenda: 'تصمیم‌گیری درباره کش و دیتابیس',
      startsAt: '2026-11-02T14:00:00Z',
      attendees: [
        { userId: 'user-1', name: 'مدیر فنی', role: 'CHAIR' },
        { userId: 'user-2', name: 'توسعه‌دهنده ارشد', role: 'MEMBER' },
      ],
    });

    const updated = await service.signMeeting(
      'org-1',
      'user-2',
      meeting.id,
      'SIGNED',
    );

    const signedAttendee = updated.attendees.find((a) => a.userId === 'user-2');
    expect(signedAttendee?.signatureStatus).toBe('SIGNED');
    expect(signedAttendee?.signedAt).toBeDefined();
  });

  it('converts resolution into CRM task with automated delegation', async () => {
    const meeting = await service.createMeeting('org-1', 'user-1', {
      title: 'جلسه ارزیابی ریسک',
      agenda: 'بررسی چک‌لیست امنیت',
      startsAt: '2026-11-03T10:00:00Z',
      attendees: [{ userId: 'user-1', name: 'مدیر', role: 'CHAIR' }],
      resolutions: [
        {
          title: 'به‌روزرسانی کلیدهای دسترسی API',
          assigneeId: 'user-1',
          dueAt: '2026-11-10T12:00:00Z',
        },
      ],
    });

    const resId = meeting.resolutions[0]!.id;
    const converted = await service.convertResolutionToTask(
      'org-1',
      'user-1',
      meeting.id,
      resId,
      { projectId: 'proj-1' },
    );

    expect(converted.resolution.status).toBe('CONVERTED_TO_TASK');
    expect(converted.resolution.taskId).toBe('task-gen-1');
  });
});
