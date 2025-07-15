import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomFeatureDto } from './dto/create-room-feature.dto';

@Injectable()
export class RoomFeaturesService {
  constructor(private prisma: PrismaService) {}

  async addFeatureToRoom(dto: CreateRoomFeatureDto) {
    const { roomId, featureId } = dto;
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        features: {
          connect: { id: featureId },
        },
      },
    });
  }

  async removeFeatureFromRoom(dto: CreateRoomFeatureDto) {
    const { roomId, featureId } = dto;
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        features: {
          disconnect: { id: featureId },
        },
      },
    });
  }

  async getRoomFeatures(roomId: string) {
    return this.prisma.room.findUnique({
      where: { id: roomId },
      include: { features: true },
    });
  }

  async getAllFeatures() {
    return this.prisma.feature.findMany();
  }
}
