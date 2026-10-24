import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { BackupService } from './backup.service.js';
import {
  BackupDownloadPackageDto,
  BackupScope,
  BackupSnapshotDto,
  CreateBackupDto,
  ExecuteRestoreDrillDto,
  RestoreDrillResultDto,
} from './dto/backup.dto.js';

@Controller('operations/backups')
@UseGuards(AuthGuard, PermissionsGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  @RequirePermission('organization_settings')
  async createBackup(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateBackupDto,
  ): Promise<BackupSnapshotDto> {
    if (dto.scope === 'SYSTEM' && user.activeOrganization.role !== 'SystemOwner') {
      throw new ForbiddenException('Only SystemOwner can trigger full system backups');
    }
    return this.backupService.createBackup(user, dto);
  }

  @Get()
  @RequirePermission('organization_settings')
  async listBackups(
    @CurrentUser() user: UserContext,
    @Query('scope') scope?: BackupScope,
    @Query('includeExpired') includeExpired?: string,
  ): Promise<BackupSnapshotDto[]> {
    return this.backupService.listBackups(user, {
      scope,
      includeExpired: includeExpired === 'true',
    });
  }

  @Get(':id/download')
  @RequirePermission('organization_settings')
  async downloadBackup(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BackupDownloadPackageDto> {
    const pkg = await this.backupService.getBackupDownload(user, id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${id}.enc.json"`);

    return pkg;
  }

  @Post(':id/restore-drill')
  @RequirePermission('organization_settings')
  async executeRestoreDrill(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto?: ExecuteRestoreDrillDto,
  ): Promise<RestoreDrillResultDto> {
    return this.backupService.executeRestoreDrill(user, id, dto);
  }

  @Delete(':id')
  @RequirePermission('organization_settings')
  async deleteBackup(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Query('force') force?: string,
  ): Promise<{ success: boolean; id: string; message: string }> {
    return this.backupService.deleteBackup(user, id, force === 'true');
  }
}
