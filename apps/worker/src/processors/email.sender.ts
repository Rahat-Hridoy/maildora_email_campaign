import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { SendCampaignEmailJob } from '@maildora/queue';
import { EmailStatus } from '@prisma/client';

export class EmailSender {
  static async handle(
    data: SendCampaignEmailJob,
    prisma: PrismaService,
    configService: ConfigService,
  ): Promise<void> {
    const { campaignId, recipientId, to, subject, body, fromEmail, fromName } = data;

    try {
      await prisma.recipient.update({
        where: { id: recipientId },
        data: { status: EmailStatus.QUEUED },
      });

      await EmailSender.sendViaBrevo({ to, subject, body, fromEmail, fromName }, configService);

      await prisma.recipient.update({
        where: { id: recipientId },
        data: { status: EmailStatus.SENT, sentAt: new Date() },
      });

      await prisma.campaignStats.update({
        where: { campaignId },
        data: { totalSent: { increment: 1 } },
      });

      console.log(` Email sent to: ${to}`);
    } catch (err) {
      console.error(` Email failed to: ${to}`, err);

      await prisma.recipient.update({
        where: { id: recipientId },
        data: { status: EmailStatus.FAILED },
      });

      await prisma.campaignStats.update({
        where: { campaignId },
        data: { failed: { increment: 1 } },
      });

      throw err;
    }
  }

  static async sendViaBrevo(
    params: { to: string; subject: string; body: string; fromEmail: string; fromName: string },
    configService: ConfigService,
  ): Promise<void> {
    const apiKey = configService.get('BREVO_API_KEY');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: params.fromName, email: params.fromEmail },
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
