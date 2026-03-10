export const EMAIL_QUEUE = 'email-queue';
export const PRIORITY_QUEUE = 'priority-queue';
export const BULK_QUEUE = 'bulk-queue';
export const RETRY_QUEUE = 'retry-queue';

export const EMAIL_JOB = {
  SEND_CAMPAIGN_EMAIL: 'send-campaign-email',
  SEND_BATCH_EMAIL: 'send-batch-email',
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

export interface SendBatchEmailJob {
  campaignId: string;
  batch: SendCampaignEmailJob[];
}
