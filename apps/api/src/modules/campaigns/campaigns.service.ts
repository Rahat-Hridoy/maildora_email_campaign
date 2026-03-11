import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignStatus, EmailStatus } from '@prisma/client';
import { PRIORITY_QUEUE, BULK_QUEUE, EMAIL_JOB, SendCampaignEmailJob } from '@maildora/queue';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(PRIORITY_QUEUE) private priorityQueue: Queue,
    @InjectQueue(BULK_QUEUE) private bulkQueue: Queue,
  ) {}

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    status?: CampaignStatus,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(status && { status }),
    };

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          senderEmail: true,
          stats: true,
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
      include: {
        senderEmail: true,
        stats: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async create(organizationId: string, dto: CreateCampaignDto) {
    const senderEmail = await this.prisma.fromEmail.findFirst({
      where: {
        id: dto.senderEmailId,
        organizationId,
      },
    });

    if (!senderEmail) {
      throw new NotFoundException('Email not found');
    }

    if (!senderEmail.verified) {
      throw new BadRequestException('Email not verified');
    }

    return this.prisma.campaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        organizationId,
        senderEmailId: dto.senderEmailId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: dto.scheduledAt
          ? CampaignStatus.SCHEDULED
          : CampaignStatus.DRAFT,
        stats: {
          create: {},
        },
      },
      include: {
        senderEmail: true,
        stats: true,
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(id, organizationId);

    if (
      campaign.status === CampaignStatus.SENT ||
      campaign.status === CampaignStatus.PROCESSING
    ) {
      throw new BadRequestException('Operation in progessing ! Try later');
    }

    if (dto.senderEmailId) {
      const senderEmail = await this.prisma.fromEmail.findFirst({
        where: {
          id: dto.senderEmailId,
          organizationId,
        },
      });

      if (!senderEmail) {
        throw new NotFoundException('Sender email not found');
      }

      if (!senderEmail.verified) {
        throw new BadRequestException('Sender email not verified');
      }
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.subject && { subject: dto.subject }),
        ...(dto.body && { body: dto.body }),
        ...(dto.senderEmailId && { senderEmailId: dto.senderEmailId }),
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        senderEmail: true,
        stats: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const campaign = await this.findOne(id, organizationId);

    if (
      campaign.status === CampaignStatus.PROCESSING ||
      campaign.status === CampaignStatus.SENT
    ) {
      throw new BadRequestException(
        'Campaign processing or already sent, can not delete',
      );
    }

    await this.prisma.campaign.delete({ where: { id } });

    return { message: 'Campaign deleted successfully' };
  }

  async duplicate(id: string, organizationId: string) {
    const campaign = await this.findOne(id, organizationId);

    return this.prisma.campaign.create({
      data: {
        subject: `${campaign.subject} (Copy)`,
        body: campaign.body,
        organizationId,
        senderEmailId: campaign.senderEmailId,
        status: CampaignStatus.DRAFT,
        stats: {
          create: {},
        },
      },
      include: {
        senderEmail: true,
        stats: true,
      },
    });
  }

  async cancel(id: string, organizationId: string) {
    const campaign = await this.findOne(id, organizationId);

    if (campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled campaigns can be cancelled',
      );
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CANCELLED },
      include: {
        senderEmail: true,
        stats: true,
      },
    });
  }

  async getStats(organizationId: string) {
    const [total, draft, scheduled, sent, cancelled] = await Promise.all([
      this.prisma.campaign.count({ where: { organizationId } }),
      this.prisma.campaign.count({
        where: { organizationId, status: CampaignStatus.DRAFT },
      }),
      this.prisma.campaign.count({
        where: { organizationId, status: CampaignStatus.SCHEDULED },
      }),
      this.prisma.campaign.count({
        where: { organizationId, status: CampaignStatus.SENT },
      }),
      this.prisma.campaign.count({
        where: { organizationId, status: CampaignStatus.CANCELLED },
      }),
    ]);

    return { total, draft, scheduled, sent, cancelled };
  }

  // ─── Campaign Send ───
  async send(id: string, organizationId: string) {
    const campaign = await this.findOne(id, organizationId);

    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Only Draft or Scheduled campaigns can be sent',
      );
    }

    if (!campaign.senderEmail.verified) {
      throw new BadRequestException('Sender email not verified');
    }

    const contacts = await this.prisma.contact.findMany({
      where: {
        organizationId,
        unsubscribed: false,
      },
    });

    if (contacts.length === 0) {
      throw new BadRequestException('No active contacts found');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PROCESSING },
    });

    const recipients = await this.prisma.$transaction(
      contacts.map((contact) =>
        this.prisma.recipient.upsert({
          where: {
            campaignId_email: {
              campaignId: id,
              email: contact.email,
            },
          },
          create: {
            email: contact.email,
            status: EmailStatus.PENDING,
            campaignId: id,
            contactId: contact.id,
          },
          update: {},
        }),
      ),
    );

    const jobs = recipients.map((recipient) => ({
      name: EMAIL_JOB.SEND_CAMPAIGN_EMAIL,
      data: {
        campaignId: id,
        recipientId: recipient.id,
        to: recipient.email,
        subject: campaign.subject,
        body: campaign.body,
        fromEmail: campaign.senderEmail.email,
        fromName: campaign.senderEmail.email.split('@')[0],
      } as SendCampaignEmailJob,
    }));

    const queue = this.priorityQueue;
    await queue.addBulk(jobs);
    console.log(`✅ ${jobs.length} emails added to queue`);

    return {
      message: `${recipients.length} emails added to queue`,
      total: recipients.length,
    };
  }
}
