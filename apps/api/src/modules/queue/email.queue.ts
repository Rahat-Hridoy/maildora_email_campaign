// queue/email.queue.ts

export const EMAIL_QUEUE = 'email-queue';

export const EMAIL_JOB = {
  SEND_CAMPAIGN_EMAIL: 'send-campaign-email',
};

export interface SendCampaignEmailJob {
  campaignId: string;
  recipientId: string;
  to: string;
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
}
