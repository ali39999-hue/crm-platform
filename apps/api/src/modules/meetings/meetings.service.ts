import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  ConvertResolutionToTaskRequest,
  CreateMeetingMinuteRequest,
  MeetingAttendeeDto,
  MeetingMinuteDto,
  MeetingResolutionDto,
  SignatureStatus,
} from '@crm/contracts';
import { AuditService } from '../audit/audit.service.js';
import { TasksService } from '../tasks/tasks.service.js';

@Injectable()
export class MeetingsService {
  // In-memory store: organizationId -> Map<meetingId, MeetingMinuteDto>
  private meetingsByOrg: Map<string, Map<string, MeetingMinuteDto>> = new Map();

  constructor(
    private readonly auditService: AuditService,
    private readonly tasksService: TasksService,
  ) {}

  private getOrgStore(orgId: string): Map<string, MeetingMinuteDto> {
    if (!this.meetingsByOrg.has(orgId)) {
      this.meetingsByOrg.set(orgId, new Map());
    }
    return this.meetingsByOrg.get(orgId)!;
  }

  async createMeeting(
    organizationId: string,
    actorId: string,
    dto: CreateMeetingMinuteRequest,
    requestId?: string,
  ): Promise<MeetingMinuteDto> {
    const store = this.getOrgStore(organizationId);
    const meetingId = randomUUID();
    const now = new Date().toISOString();

    const attendees: MeetingAttendeeDto[] = dto.attendees.map((a) => ({
      userId: a.userId,
      name: a.name,
      role: a.role || 'MEMBER',
      signatureStatus: 'PENDING',
    }));

    const resolutions: MeetingResolutionDto[] = (dto.resolutions || []).map((r) => ({
      id: randomUUID(),
      meetingId,
      title: r.title.trim(),
      assigneeId: r.assigneeId,
      dueAt: r.dueAt,
      status: 'PENDING',
    }));

    const meeting: MeetingMinuteDto = {
      id: meetingId,
      organizationId,
      title: dto.title.trim(),
      agenda: dto.agenda.trim(),
      location: dto.location,
      meetingUrl: dto.meetingUrl,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      status: 'SCHEDULED',
      attendees,
      resolutions,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };

    store.set(meetingId, meeting);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'MEETING_MINUTES_CREATED',
      entityType: 'MEETING',
      entityId: meetingId,
      requestId,
      metadata: { title: meeting.title, attendeesCount: attendees.length, resolutionsCount: resolutions.length },
    });

    return meeting;
  }

  async listMeetings(organizationId: string): Promise<MeetingMinuteDto[]> {
    const store = this.getOrgStore(organizationId);
    return Array.from(store.values()).sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
  }

  async getMeetingById(organizationId: string, meetingId: string): Promise<MeetingMinuteDto> {
    const store = this.getOrgStore(organizationId);
    const meeting = store.get(meetingId);
    if (!meeting) {
      throw new NotFoundException(`صورتجلسه با شناسه «${meetingId}» یافت نشد.`);
    }
    return meeting;
  }

  async signMeeting(
    organizationId: string,
    userId: string,
    meetingId: string,
    status: SignatureStatus,
    requestId?: string,
  ): Promise<MeetingMinuteDto> {
    const store = this.getOrgStore(organizationId);
    const meeting = store.get(meetingId);
    if (!meeting) {
      throw new NotFoundException(`صورتجلسه با شناسه «${meetingId}» یافت نشد.`);
    }

    const attendee = meeting.attendees.find((a) => a.userId === userId);
    if (!attendee) {
      throw new BadRequestException('کاربر جاری در لیست مدعوین یا شرکت‌کنندگان این صورتجلسه نیست.');
    }

    attendee.signatureStatus = status;
    attendee.signedAt = new Date().toISOString();

    // If all attendees have signed, transition meeting status to COMPLETED
    if (meeting.attendees.every((a) => a.signatureStatus === 'SIGNED')) {
      meeting.status = 'COMPLETED';
    }

    meeting.updatedAt = new Date().toISOString();

    this.auditService.record({
      organizationId,
      actorId: userId,
      action: 'MEETING_MINUTES_SIGNED',
      entityType: 'MEETING',
      entityId: meetingId,
      requestId,
      metadata: { signatureStatus: status },
    });

    return meeting;
  }

  async convertResolutionToTask(
    organizationId: string,
    actorId: string,
    meetingId: string,
    resolutionId: string,
    dto: ConvertResolutionToTaskRequest,
    requestId?: string,
  ): Promise<{ resolution: MeetingResolutionDto; taskId: string }> {
    const store = this.getOrgStore(organizationId);
    const meeting = store.get(meetingId);
    if (!meeting) {
      throw new NotFoundException(`صورتجلسه با شناسه «${meetingId}» یافت نشد.`);
    }

    const resolution = meeting.resolutions.find((r) => r.id === resolutionId);
    if (!resolution) {
      throw new NotFoundException(`مصوبه با شناسه «${resolutionId}» در این صورتجلسه یافت نشد.`);
    }

    if (resolution.status === 'CONVERTED_TO_TASK' && resolution.taskId) {
      return { resolution, taskId: resolution.taskId };
    }

    // Call TasksService to generate the CRM task
    const taskPayload: any = {
      title: `[مصوبه جلسه ${meeting.title}]: ${resolution.title}`,
      assigneeId: resolution.assigneeId,
      priority: 'MEDIUM',
    };
    if (resolution.dueAt) taskPayload.dueAt = resolution.dueAt;
    if (dto.projectId) taskPayload.projectId = dto.projectId;

    const task = await this.tasksService.createTask(
      organizationId,
      actorId,
      taskPayload,
      requestId,
    );

    resolution.status = 'CONVERTED_TO_TASK';
    resolution.taskId = task.id;
    meeting.updatedAt = new Date().toISOString();

    this.auditService.record({
      organizationId,
      actorId,
      action: 'RESOLUTION_CONVERTED_TO_TASK',
      entityType: 'MEETING',
      entityId: meetingId,
      requestId,
      metadata: { resolutionId, taskId: task.id },
    });

    return { resolution, taskId: task.id };
  }
}
