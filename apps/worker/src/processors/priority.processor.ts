import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { PRIORITY_QUEUE, EMAIL_JOB, SendCampaignEmailJob } from '@maildora/queue';
import { EmailSender } from './email.sender';

@Processor(PRIORITY_QUEUE, { 
  concurrency: 5,
  limiter: { max: 150, duration: 60000 },
})
export class PriorityProcessor extends WorkerHost {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    console.log(` [PRIORITY] Job: ${job.name} [${job.id}]`);
    if (job.name === EMAIL_JOB.SEND_CAMPAIGN_EMAIL) {
      await EmailSender.handle(job.data as SendCampaignEmailJob, this.prisma, this.configService);
    }
  }
}
