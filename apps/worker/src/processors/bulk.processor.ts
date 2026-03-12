import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { BULK_QUEUE, EMAIL_JOB, SendCampaignEmailJob } from '@maildora/queue';
import { EmailSender } from './email.sender';

@Processor(BULK_QUEUE, { 
  concurrency: 3,
  limiter: { max: 150, duration: 60000 },
})
export class BulkProcessor extends WorkerHost {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    console.log(`[BULK] Job: ${job.name} [${job.id}]`);
    if (job.name === EMAIL_JOB.SEND_CAMPAIGN_EMAIL) {
      await EmailSender.handle(job.data as SendCampaignEmailJob, this.prisma, this.configService);
    }
  }
}
