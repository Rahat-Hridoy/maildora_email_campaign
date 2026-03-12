// apps/api/src/modules/auth/auth.controller.ts

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk.guard';
import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private clerkClient;

  constructor(private configService: ConfigService) {
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
    });
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getMe(@Request() req) {
    const clerkUser = await this.clerkClient.users.getUser(
      req.clerkUserId,
    );

    return {
      user: req.user,
      platformRole: clerkUser.publicMetadata?.platformRole ?? 'USER',
      isSuperAdmin:
        clerkUser.publicMetadata?.platformRole === 'SUPER_ADMIN',
    };
  }
}