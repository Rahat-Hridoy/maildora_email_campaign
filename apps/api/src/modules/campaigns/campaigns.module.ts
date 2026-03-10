import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../../prisma.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, PrismaService, ClerkAuthGuard, RolesGuard],
  exports: [CampaignsService],
})
export class CampaignsModule {}
