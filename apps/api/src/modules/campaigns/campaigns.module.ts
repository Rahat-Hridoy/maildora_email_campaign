import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../../prisma.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService, PrismaService, ClerkAuthGuard, RolesGuard],
  exports: [CampaignsService],
})
export class CampaignsModule {}
