import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  createRoom(
    @Body() dto: CreateRoomDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.roomsService.createRoom(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  getRooms(@Req() req: { user: JwtPayload }) {
    return this.roomsService.getRooms(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  getRoomById(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.roomsService.getRoomById(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.roomsService.updateRoom(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.roomsService.deleteRoom(id, req.user);
  }
}
