import { Module } from '@nestjs/common';
import { SenderEmailsController } from './sender-emails.controller';
import { SenderEmailsService } from './sender-emails.service';
import { PrismaService } from '../../prisma.service';
import { RolesGuard } from '../auth/roles.guard';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Module({
  controllers: [SenderEmailsController],
  providers: [SenderEmailsService, PrismaService, ClerkAuthGuard, RolesGuard],
  exports: [SenderEmailsService],
})
export class SenderEmailsModule {}
