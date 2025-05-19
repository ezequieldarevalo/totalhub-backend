import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('guests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post()
  async createGuest(@Body() dto: CreateGuestDto) {
    return this.guestService.createGuest(dto);
  }

  @Get()
  async searchGuests(@Query('q') q: string) {
    return this.guestService.searchGuests(q);
  }

  @Get('all')
  async getAllGuests(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sort') sort: 'name' | 'email',
    @Query('order') order: 'asc' | 'desc',
  ) {
    return this.guestService.getAllGuests(
      Number(page) || 1,
      Number(limit) || 20,
      sort || 'name',
      order || 'asc',
    );
  }

  @Get(':id')
  async getGuestById(@Param('id') id: string) {
    return this.guestService.getGuestById(id);
  }

  @Put(':id')
  async updateGuest(@Param('id') id: string, @Body() dto: CreateGuestDto) {
    return this.guestService.updateGuest(id, dto);
  }

  @Delete(':id')
  async deleteGuest(@Param('id') id: string) {
    return this.guestService.deleteGuest(id);
  }
}
