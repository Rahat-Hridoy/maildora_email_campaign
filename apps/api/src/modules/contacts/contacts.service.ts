import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ImportContactsDto } from './dto/import-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact পাওয়া যায়নি');
    }

    return contact;
  }

  async create(organizationId: string, dto: CreateContactDto) {
    const existing = await this.prisma.contact.findUnique({
      where: {
        email_organizationId: {
          email: dto.email,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('এই email আগেই আছে');
    }

    return this.prisma.contact.create({
      data: {
        email: dto.email,
        name: dto.name || null,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateContactDto) {
    await this.findOne(id, organizationId);

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.unsubscribed !== undefined && {
          unsubscribed: dto.unsubscribed,
          unsubscribedAt: dto.unsubscribed ? new Date() : null,
        }),
      },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.contact.delete({ where: { id } });
    return { message: 'Contact delete হয়েছে' };
  }

  async importContacts(organizationId: string, dto: ImportContactsDto) {
    const results = {
      success: 0,
      skipped: 0,
    };

    const BATCH_SIZE = 100;

    for (let i = 0; i < dto.contacts.length; i += BATCH_SIZE) {
      const batch = dto.contacts.slice(i, i + BATCH_SIZE);

      const result = await this.prisma.contact.createMany({
        data: batch.map((c) => ({
          email: c.email,
          name: c.name || null,
          organizationId,
        })),
        skipDuplicates: true,
      });

      results.success += result.count;
      results.skipped += batch.length - result.count;
    }

    return {
      message: `Import completed`,
      results,
    };
  }

  // ─── Stats ───
  async getStats(organizationId: string) {
    const [total, unsubscribed] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId } }),
      this.prisma.contact.count({
        where: { organizationId, unsubscribed: true },
      }),
    ]);

    return {
      total,
      active: total - unsubscribed,
      unsubscribed,
    };
  }
}
