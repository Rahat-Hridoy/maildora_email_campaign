import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerkClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.clerkClient = createClerkClient({
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
      publishableKey: this.configService.get('CLERK_PUBLISHABLE_KEY'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token পাওয়া যায়নি');
    }

    try {
      const payload = await this.clerkClient.verifyToken(token, {
        authorizedParties: ['http://localhost:3000'],
      });

      console.log(' Token valid, userId:', payload.sub);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request['user'] = user;
      request['clerkUserId'] = payload.sub;

    } catch (error: unknown) {
      console.error(' Error:', error);
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token invalid');
    }

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}