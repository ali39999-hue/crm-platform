import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { Public } from '../../common/auth/public.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import type {
  FileDto,
  SignedDownloadResponse,
  UploadIntentResponse,
} from '@crm/contracts';
import { FilesService } from './files.service.js';
import {
  CreateUploadIntentDto,
  GenerateSignedUrlDto,
  VerifyFileScanDto,
} from './dto/upload-intent.dto.js';
import { SensitiveEndpoint } from '../../common/security/rate-limiter.guard.js';

@Controller('files')
@UseGuards(AuthGuard, PermissionsGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-intent')
  @SensitiveEndpoint()
  async createUploadIntent(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateUploadIntentDto,
  ): Promise<UploadIntentResponse> {
    return this.filesService.createUploadIntent(user, dto);
  }

  @Post(':id/scan-result')
  async updateScanResult(
    @CurrentUser() user: UserContext,
    @Param('id') fileId: string,
    @Body() dto: VerifyFileScanDto,
  ): Promise<FileDto> {
    return this.filesService.updateScanResult(
      user,
      fileId,
      dto.status,
      dto.scanDetails,
    );
  }

  @Get(':id/signed-url')
  async getSignedDownloadUrl(
    @CurrentUser() user: UserContext,
    @Param('id') fileId: string,
    @Query() query: GenerateSignedUrlDto,
  ): Promise<SignedDownloadResponse> {
    return this.filesService.generateDownloadUrl(
      user,
      fileId,
      query.expiresInSec,
    );
  }

  @Post(':id/signed-url')
  async postSignedDownloadUrl(
    @CurrentUser() user: UserContext,
    @Param('id') fileId: string,
    @Body() body: GenerateSignedUrlDto,
  ): Promise<SignedDownloadResponse> {
    return this.filesService.generateDownloadUrl(
      user,
      fileId,
      body.expiresInSec,
    );
  }

  @Get(':id')
  async getFileMetadata(
    @CurrentUser() user: UserContext,
    @Param('id') fileId: string,
  ): Promise<FileDto> {
    return this.filesService.getFile(user, fileId);
  }

  @Get()
  async listFiles(
    @CurrentUser() user: UserContext,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<FileDto[]> {
    const filter: { entityType?: string; entityId?: string } = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    return this.filesService.listFiles(user, filter);
  }

  @Get(':id/download')
  @Public()
  async downloadFile(
    @Param('id') fileId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = this.filesService.verifyDownloadToken(fileId, token);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.fileSize));
    res.setHeader('X-File-Id', file.id);
    res.setHeader('X-File-Status', file.status);

    // Stream / send file content placeholder
    res.status(200).send(`[BINARY DATA FOR ${file.fileName} (${file.fileSize} bytes)]`);
  }
}
