// apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ClerkWebhookController } from './modules/webhooks/clerk.webhook.controller';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [ClerkWebhookController],
  providers: [PrismaService],
})
export class AppModule {}
