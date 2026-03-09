import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SenderEmailsService } from './sender-emails.service';
import { CreateSenderEmailDto } from './dto/create-sender-email.dto';
import { RolesGuard } from '../auth/roles.guard';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('organizations/:orgId/sender-emails')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class SenderEmailsController {
  constructor(private senderEmailsService: SenderEmailsService) {}

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.senderEmailsService.findAll(orgId);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.senderEmailsService.findOne(id, orgId);
  }

  @Post()
  create(@Param('orgId') orgId: string, @Body() dto: CreateSenderEmailDto) {
    return this.senderEmailsService.create(orgId, dto);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  syncVerification(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.senderEmailsService.syncVerificationStatus(id, orgId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.senderEmailsService.remove(id, orgId);
  }
}
