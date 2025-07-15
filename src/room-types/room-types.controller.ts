import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Controller('room-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Post()
  @Roles('SUPERADMIN')
  create(@Body() dto: CreateRoomTypeDto) {
    return this.roomTypesService.create(dto);
  }

  @Get()
  @Roles('SUPERADMIN', 'ADMIN') // ✅ ahora también permite ADMIN
  findAll() {
    return this.roomTypesService.findAll();
  }

  @Get(':id')
  @Roles('SUPERADMIN') // 👈 si querés que esto también lo vea el ADMIN, podés incluirlo
  findOne(@Param('id') id: string) {
    return this.roomTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPERADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(id, dto);
  }
}
