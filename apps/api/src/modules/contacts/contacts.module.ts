import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../prisma.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, PrismaService, ClerkAuthGuard, RolesGuard],
  exports: [ContactsService],
})
export class ContactsModule {}
