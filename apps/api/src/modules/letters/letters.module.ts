import { Module } from '@nestjs/common';
import { LettersController } from './letters.controller.js';
import { LettersService } from './letters.service.js';
import { AuditService } from '../audit/audit.service.js';

@Module({
  controllers: [LettersController],
  providers: [LettersService, AuditService],
  exports: [LettersService],
})
export class LettersModule {}
