import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ImportContactsDto } from './dto/import-contact.dto';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { OrgRole } from '@prisma/client';

@Controller('organizations/:orgId/contacts')
// @UseGuards(ClerkAuthGuard, RolesGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  // GET /organizations/:orgId/contacts
  @Get()
  @Roles(OrgRole.ADMIN, OrgRole.MEMBER)
  findAll(
    @Param('orgId') orgId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.contactsService.findAll(
      orgId,
      parseInt(page),
      parseInt(limit),
      search,
    );
  }

  // GET /organizations/:orgId/contacts/stats
  @Get('stats')
  @Roles(OrgRole.ADMIN, OrgRole.MEMBER)
  getStats(@Param('orgId') orgId: string) {
    return this.contactsService.getStats(orgId);
  }

  // GET /organizations/:orgId/contacts/:id
  @Get(':id')
  @Roles(OrgRole.ADMIN, OrgRole.MEMBER)
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.contactsService.findOne(id, orgId);
  }

  // POST /organizations/:orgId/contacts
  @Post()
  @Roles(OrgRole.ADMIN, OrgRole.MEMBER)
  create(@Param('orgId') orgId: string, @Body() dto: CreateContactDto) {
    return this.contactsService.create(orgId, dto);
  }

  // POST /organizations/:orgId/contacts/import
  @Post('import')
  @Roles(OrgRole.ADMIN, OrgRole.MEMBER)
  @HttpCode(HttpStatus.OK)
  importContacts(
    @Param('orgId') orgId: string,
    @Body() dto: ImportContactsDto,
  ) {
    return this.contactsService.importContacts(orgId, dto);
  }

  // PATCH /organizations/:orgId/contacts/:id
  @Patch(':id')
  @Roles(OrgRole.ADMIN)
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, orgId, dto);
  }

  // DELETE /organizations/:orgId/contacts/:id
  @Delete(':id')
  @Roles(OrgRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.contactsService.remove(id, orgId);
  }
}
