import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignStatus } from '@prisma/client';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('organizations/:orgId/campaigns')
// @UseGuards(ClerkAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: CampaignStatus,
  ) {
    return this.campaignsService.findAll(
      orgId,
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Get('stats')
  getStats(@Param('orgId') orgId: string) {
    return this.campaignsService.getStats(orgId);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.campaignsService.findOne(id, orgId);
  }

  @Post()
  create(@Param('orgId') orgId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(orgId, dto);
  }

  @Post(':id/duplicate')
  duplicate(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.campaignsService.duplicate(id, orgId);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  send(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.campaignsService.send(id, orgId);
  }

  @Patch(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, orgId, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.campaignsService.cancel(id, orgId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.campaignsService.remove(id, orgId);
  }
}
