import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../../common/auth/auth.types.js';
import { ImportExportService } from './import-export.service.js';

export class ImportLeadsDto {
  csv?: string;
  csvContent?: string;
  content?: string;
}

function extractCsvString(body: ImportLeadsDto | string | undefined): string {
  if (typeof body === 'string') {
    return body;
  }
  if (!body) {
    return '';
  }
  return body.csvContent ?? body.csv ?? body.content ?? '';
}

@Controller('crm')
@UseGuards(AuthGuard, PermissionsGuard)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Post('import/leads/preview')
  @RequirePermission('edit_crm')
  async previewLeadImport(
    @CurrentUser() user: UserContext,
    @Body() body: ImportLeadsDto | string,
  ) {
    const csv = extractCsvString(body);
    return this.importExportService.previewLeadImport(
      user.activeOrganization.id,
      csv,
    );
  }

  @Post('import/leads')
  @RequirePermission('edit_crm')
  async executeLeadImport(
    @CurrentUser() user: UserContext,
    @Body() body: ImportLeadsDto | string,
  ) {
    const csv = extractCsvString(body);
    return this.importExportService.executeLeadImport(
      user.activeOrganization.id,
      user.id,
      csv,
    );
  }

  @Get('export/leads')
  @RequirePermission('export_data')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="leads.csv"')
  async exportLeads(@CurrentUser() user: UserContext): Promise<string> {
    return this.importExportService.exportLeadsCsv(
      user.activeOrganization.id,
      user.id,
    );
  }

  @Get('export/contacts')
  @RequirePermission('export_data')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="contacts.csv"')
  async exportContacts(@CurrentUser() user: UserContext): Promise<string> {
    return this.importExportService.exportContactsCsv(
      user.activeOrganization.id,
      user.id,
    );
  }

  @Get('export/accounts')
  @RequirePermission('export_data')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="accounts.csv"')
  async exportAccounts(@CurrentUser() user: UserContext): Promise<string> {
    return this.importExportService.exportAccountsCsv(
      user.activeOrganization.id,
      user.id,
    );
  }
}
