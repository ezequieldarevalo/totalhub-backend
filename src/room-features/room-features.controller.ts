import {
  Controller,
  Post,
  Body,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RoomFeaturesService } from './room-features.service';
import { CreateRoomFeatureDto } from './dto/create-room-feature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('room-features')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomFeaturesController {
  constructor(private readonly service: RoomFeaturesService) {}

  @Post()
  @Roles('SUPERADMIN')
  addFeature(@Body() dto: CreateRoomFeatureDto) {
    return this.service.addFeatureToRoom(dto);
  }

  @Delete()
  @Roles('SUPERADMIN')
  removeFeature(@Body() dto: CreateRoomFeatureDto) {
    return this.service.removeFeatureFromRoom(dto);
  }

  @Get(':roomId')
  @Roles('SUPERADMIN', 'ADMIN') // 👈 permite a ambos ver las features de una room
  getRoomFeatures(@Param('roomId') roomId: string) {
    return this.service.getRoomFeatures(roomId);
  }

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  getAllFeatures() {
    return this.service.getAllFeatures();
  }
}
