// queue/email.processor.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import {
  EMAIL_QUEUE,
  EMAIL_JOB,
  SendCampaignEmailJob,
} from './email.queue';
import { EmailStatus } from '@prisma/client';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    console.log('🔄 Job processing:', job.name, job.id);

    if (job.name === EMAIL_JOB.SEND_CAMPAIGN_EMAIL) {
      await this.handleSendCampaignEmail(job.data as SendCampaignEmailJob);
    }
  }

  private async handleSendCampaignEmail(
    data: SendCampaignEmailJob,
  ): Promise<void> {
    const { campaignId, recipientId, to, subject, body, fromEmail, fromName } =
      data;

    try {
      await this.prisma.recipient.update({
        where: { id: recipientId },
        data: { status: EmailStatus.QUEUED },
      });

      await this.sendViaBrevo({ to, subject, body, fromEmail, fromName });

      await this.prisma.recipient.update({
        where: { id: recipientId },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        },
      });

      await this.prisma.campaignStats.update({
        where: { campaignId },
        data: {
          totalSent: { increment: 1 },
        },
      });

      console.log(`Email sent to: ${to}`);
    } catch (err) {
      console.error(`Email failed to: ${to}`, err);

      await this.prisma.recipient.update({
        where: { id: recipientId },
        data: { status: EmailStatus.FAILED },
      });

      await this.prisma.campaignStats.update({
        where: { campaignId },
        data: {
          failed: { increment: 1 },
        },
      });

      throw err;
    }
  }

  private async sendViaBrevo(params: {
    to: string;
    subject: string;
    body: string;
    fromEmail: string;
    fromName: string;
  }): Promise<void> {
    const apiKey = this.configService.get('BREVO_API_KEY');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: params.fromName,
            email: params.fromEmail,
          },
          to: [{ email: params.to }],
          subject: params.subject,
          htmlContent: params.body,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Brevo error: ${error.message ?? 'Unknown error'}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
