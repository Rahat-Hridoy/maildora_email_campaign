import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

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

  // ─── Stats ───
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
}
