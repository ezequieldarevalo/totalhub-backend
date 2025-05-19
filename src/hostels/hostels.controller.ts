import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { HostelsService } from './hostels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateHostelDto } from './dto/create-hostel.dto';

@Controller('hostels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class HostelsController {
  constructor(private readonly hostelsService: HostelsService) {}

  @Post()
  create(@Body() dto: CreateHostelDto) {
    return this.hostelsService.create(dto);
  }

  @Get()
  async findAll() {
    const result = await this.hostelsService.findAll();
    console.log('Hostels:', result); // 👈 esto
    return result;
  }
}
