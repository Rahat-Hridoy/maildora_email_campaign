// apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ClerkWebhookController } from './modules/webhooks/clerk.webhook.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SenderEmailsModule } from './modules/sender-emails/sender-emails.module';
import { QueueModule } from './modules/queue/queue.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ContactsModule,
    CampaignsModule,
    SenderEmailsModule,
    QueueModule,
  ],
  controllers: [ClerkWebhookController, AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {}
