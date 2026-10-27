import {
  BadRequestException,
  Inject,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type {
  CreateCustomFieldRequest,
  CustomFieldDefinitionDto,
  CustomFieldEntityType,
  UpdateCustomFieldRequest,
  ValidateCustomFieldsResponse,
} from '@crm/contracts';
import {
  type ICustomFieldRepository,
  type CustomFieldEntity,
} from './custom-field.repository.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class CustomFieldService {
  private readonly logger = new Logger(CustomFieldService.name);

  constructor(
    @Inject('CUSTOM_FIELD_REPOSITORY')
    private readonly fieldRepo: ICustomFieldRepository,
    private readonly auditService: AuditService,
  ) {}

  async getFields(
    organizationId: string,
    entityType?: CustomFieldEntityType,
  ): Promise<CustomFieldDefinitionDto[]> {
    const list = await this.fieldRepo.findByOrg(organizationId, entityType);
    return list.map((f) => this.mapDto(f));
  }

  async getFieldById(
    organizationId: string,
    id: string,
  ): Promise<CustomFieldDefinitionDto> {
    const field = await this.fieldRepo.findById(organizationId, id);
    if (!field) {
      throw new NotFoundException(`Custom field ${id} not found`);
    }
    return this.mapDto(field);
  }

  async createField(
    organizationId: string,
    actorId: string,
    dto: CreateCustomFieldRequest,
  ): Promise<CustomFieldDefinitionDto> {
    const normalizedKey = dto.key.trim().toLowerCase().replace(/[\s-]+/g, '_');

    // Key format validation
    if (!/^[a-z0-9_]{2,40}$/.test(normalizedKey)) {
      throw new BadRequestException(
        'کلید فیلد باید شامل حروف انگلیسی کوچک، اعداد و زیرخط (Underline) بین ۲ تا ۴۰ کاراکتر باشد',
      );
    }

    // Check duplicate key
    const existing = await this.fieldRepo.findByKey(
      organizationId,
      dto.entityType,
      normalizedKey,
    );
    if (existing) {
      throw new ConflictException(
        `فیلد سفارشی با کلید «${normalizedKey}» قبلاً برای موجودیت ${dto.entityType} تعریف شده است`,
      );
    }

    if (dto.type === 'SELECT' && (!dto.options || dto.options.length === 0)) {
      throw new BadRequestException('برای فیلدهای از نوع انتخابی (SELECT) درج گزینه‌ها الزامی است');
    }

    const field = await this.fieldRepo.create({
      organizationId,
      entityType: dto.entityType,
      key: normalizedKey,
      label: dto.label.trim(),
      type: dto.type,
      options: dto.options,
      isRequired: Boolean(dto.isRequired),
      defaultValue: dto.defaultValue,
      order: dto.order ?? 99,
      active: true,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CUSTOM_FIELD_CREATED',
      entityType: 'CustomField',
      entityId: field.id,
      metadata: { key: field.key, entityType: field.entityType, type: field.type },
    });

    return this.mapDto(field);
  }

  async updateField(
    organizationId: string,
    actorId: string,
    id: string,
    dto: UpdateCustomFieldRequest,
  ): Promise<CustomFieldDefinitionDto> {
    const existing = await this.fieldRepo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`Custom field ${id} not found`);
    }

    if (dto.label !== undefined) existing.label = dto.label.trim();
    if (dto.options !== undefined) existing.options = dto.options;
    if (dto.isRequired !== undefined) existing.isRequired = dto.isRequired;
    if (dto.defaultValue !== undefined) existing.defaultValue = dto.defaultValue;
    if (dto.order !== undefined) existing.order = dto.order;
    if (dto.active !== undefined) existing.active = dto.active;

    const updated = await this.fieldRepo.update(existing);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CUSTOM_FIELD_UPDATED',
      entityType: 'CustomField',
      entityId: updated.id,
      metadata: { key: updated.key, active: updated.active },
    });

    return this.mapDto(updated);
  }

  async deleteField(
    organizationId: string,
    actorId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.fieldRepo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`Custom field ${id} not found`);
    }

    await this.fieldRepo.delete(organizationId, id);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CUSTOM_FIELD_DELETED',
      entityType: 'CustomField',
      entityId: id,
      metadata: { key: existing.key, entityType: existing.entityType },
    });

    return { success: true };
  }

  /**
   * Validates custom field values against defined schema for an entity type
   */
  async validateValues(
    organizationId: string,
    entityType: CustomFieldEntityType,
    values: Record<string, any>,
  ): Promise<ValidateCustomFieldsResponse> {
    const fields = await this.fieldRepo.findByOrg(organizationId, entityType);
    const activeFields = fields.filter((f) => f.active);
    const errors: Array<{ fieldKey: string; message: string }> = [];

    for (const field of activeFields) {
      const val = values[field.key];

      // Required check
      if (field.isRequired && (val === undefined || val === null || val === '')) {
        errors.push({
          fieldKey: field.key,
          message: `تکمیل فیلد اجباری «${field.label}» الزامی است`,
        });
        continue;
      }

      if (val === undefined || val === null || val === '') continue;

      // Type checks
      if (field.type === 'NUMBER') {
        const num = Number(val);
        if (Number.isNaN(num)) {
          errors.push({
            fieldKey: field.key,
            message: `مقدار فیلد «${field.label}» باید عدد معتبر باشد`,
          });
        }
      } else if (field.type === 'SELECT') {
        if (field.options && !field.options.includes(String(val))) {
          errors.push({
            fieldKey: field.key,
            message: `مقدار انتخاب‌شده برای «${field.label}» جزو گزینه‌های مجاز نیست`,
          });
        }
      } else if (field.type === 'BOOLEAN') {
        if (typeof val !== 'boolean' && val !== 'true' && val !== 'false') {
          errors.push({
            fieldKey: field.key,
            message: `مقدار فیلد «${field.label}» باید بولیین (صحیح/غلط) باشد`,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private mapDto(f: CustomFieldEntity): CustomFieldDefinitionDto {
    const dto: CustomFieldDefinitionDto = {
      id: f.id,
      organizationId: f.organizationId,
      entityType: f.entityType,
      key: f.key,
      label: f.label,
      type: f.type,
      isRequired: f.isRequired,
      order: f.order,
      active: f.active,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    };
    if (f.options !== undefined) dto.options = f.options;
    if (f.defaultValue !== undefined) dto.defaultValue = f.defaultValue;
    return dto;
  }
}
