import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { OrgRole } from '@prisma/client';
import type { Request } from 'express';

@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const webhookSecret = this.configService.get('CLERK_WEBHOOK_SECRET');
    const wh = new Webhook(webhookSecret);

    let event: any;
    try {
      event = wh.verify(req.rawBody as Buffer, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch {
      throw new BadRequestException('Invalid webhook');
    }

    const { type, data } = event;

    switch (type) {

      case 'user.created': {
        // ✅ primary_email_address_id দিয়ে email খোঁজো
        const primaryEmail = data.email_addresses?.find(
          (e: any) => e.id === data.primary_email_address_id,
        )?.email_address;

        // ✅ না পেলে প্রথমটা নাও
        const firstEmail =
          data.email_addresses?.length > 0
            ? data.email_addresses[0].email_address
            : null;

        const email: string | null = primaryEmail ?? firstEmail ?? null;

        if (!email) {
          console.log('⚠️ Test webhook — email নেই, skip করছি');
          break;
        }

        const firstName: string = data.first_name ?? '';
        const lastName: string = data.last_name ?? '';
        const name =
          `${firstName} ${lastName}`.trim() || email.split('@')[0];
        const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

        try {
          await this.prisma.user.create({
            data: {
              id: data.id,
              email,
              name: name || null,
              avatar: data.image_url || null,
              memberships: {
                create: {
                  role: OrgRole.ADMIN,
                  organization: {
                    create: {
                      name: `${name}'s Organization`,
                      slug,
                    },
                  },
                },
              },
            },
          });
          console.log('✅ User তৈরি হয়েছে:', email);
        } catch (err) {
          console.error('❌ User তৈরিতে error:', err);
        }
        break;
      }

      case 'user.updated': {
        const firstName: string = data.first_name ?? '';
        const lastName: string = data.last_name ?? '';
        const name = `${firstName} ${lastName}`.trim();

        try {
          await this.prisma.user.update({
            where: { id: data.id },
            data: {
              name: name || null,
              avatar: data.image_url || null,
            },
          });
          console.log('✅ User update হয়েছে:', data.id);
        } catch (err) {
          console.error('❌ User update এ error:', err);
        }
        break;
      }

      case 'user.deleted': {
        try {
          await this.prisma.user.delete({
            where: { id: data.id },
          });
          console.log('✅ User delete হয়েছে:', data.id);
        } catch (err) {
          console.error('❌ User delete এ error:', err);
        }
        break;
      }

    }

    return { received: true };
  }
}