// apps/api/src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClerkAuthGuard } from './clerk.guard';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AuthController],
  providers: [ClerkAuthGuard, PrismaService],
  exports: [ClerkAuthGuard],
})
export class AuthModule {}
