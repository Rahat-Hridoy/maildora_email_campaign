import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateSenderEmailDto } from './dto/create-sender-email.dto';

@Injectable()
export class SenderEmailsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.fromEmail.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const senderEmail = await this.prisma.fromEmail.findFirst({
      where: { id, organizationId },
    });

    if (!senderEmail) {
      throw new NotFoundException('Sender email not found');
    }

    return senderEmail;
  }

  async create(organizationId: string, dto: CreateSenderEmailDto) {
    const existing = await this.prisma.fromEmail.findUnique({
      where: {
        email_organizationId: {
          email: dto.email,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Email already exists !');
    }

    await this.createBrevoSender(dto.email);

    return this.prisma.fromEmail.create({
      data: {
        email: dto.email,
        verified: false,
        organizationId,
      },
    });
  }

  async syncVerificationStatus(id: string, organizationId: string) {
    const senderEmail = await this.findOne(id, organizationId);

    if (senderEmail.verified) {
      throw new BadRequestException('Alerady verified');
    }

    const isVerified = await this.checkBrevoVerification(senderEmail.email);

    if (!isVerified) {
      return {
        message: 'Email is not verified yet.',
        verified: false,
      };
    }

    const updated = await this.prisma.fromEmail.update({
      where: { id },
      data: { verified: true },
    });

    return {
      message: 'Email verified successfully.',
      verified: true,
      data: updated,
    };
  }

  async remove(id: string, organizationId: string) {
    const senderEmail = await this.findOne(id, organizationId);

    const campaignCount = await this.prisma.campaign.count({
      where: { senderEmailId: id },
    });

    if (campaignCount > 0) {
      throw new BadRequestException(
        `This email is being used in ${campaignCount} campaigns. It cannot be deleted.`,
      );
    }

    await this.deleteBrevoSender(senderEmail.email);

    await this.prisma.fromEmail.delete({ where: { id } });

    return { message: 'Sender email deleted successfully.' };
  }

  private async createBrevoSender(email: string) {
    const apiKey = this.configService.get('BREVO_API_KEY');

    const response = await fetch('https://api.brevo.com/v3/senders', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: email.split('@')[0],
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status !== 400) {
        throw new BadRequestException(
          `Brevo sender : ${error.message ?? 'Unknown error'}`,
        );
      }
    }
  }

  private async checkBrevoVerification(email: string): Promise<boolean> {
    const apiKey = this.configService.get('BREVO_API_KEY');

    const response = await fetch('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': apiKey },
    });

    if (!response.ok) return false;

    const data = await response.json();
    const sender = data.senders?.find((s: any) => s.email === email);

    return sender?.active === true;
  }

  private async deleteBrevoSender(email: string) {
    const apiKey = this.configService.get('BREVO_API_KEY');

    const listResponse = await fetch('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': apiKey },
    });

    if (!listResponse.ok) return;

    const data = await listResponse.json();
    const sender = data.senders?.find((s: any) => s.email === email);

    if (!sender) return;

    await fetch(`https://api.brevo.com/v3/senders/${sender.id}`, {
      method: 'DELETE',
      headers: { 'api-key': apiKey },
    });
  }
}
