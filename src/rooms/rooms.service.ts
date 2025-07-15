import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async createRoom(
    dto: CreateRoomDto,
    user: JwtPayload,
  ): Promise<RoomResponseDto> {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create rooms');
    }

    const created = await this.prisma.room.create({
      data: {
        roomTypeId: dto.roomTypeId,
        hostelId: user.hostelId,
        features: dto.featureIds?.length
          ? {
              connect: dto.featureIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        roomType: {
          select: {
            name: true,
            slug: true,
            capacity: true,
          },
        },
        features: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    return RoomResponseDto.fromEntity(created);
  }

  async getRooms(user: JwtPayload) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view rooms');
    }

    const rooms = await this.prisma.room.findMany({
      where: {
        hostelId: user.hostelId,
      },
      include: {
        roomType: true,
        features: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
      orderBy: {
        roomType: {
          name: 'asc',
        },
      },
    });

    return rooms.map((room) => RoomResponseDto.fromEntity(room));
  }

  async updateRoom(
    id: string,
    dto: UpdateRoomDto,
    user: JwtPayload,
  ): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findFirst({
      where: {
        id,
        hostelId: user.hostelId,
      },
    });

    if (!room) {
      throw new BadRequestException('Room not found or access denied');
    }

    // Si querés validar que no haya otro room con mismo roomTypeId (opcional)
    if (dto.roomTypeId) {
      const exists = await this.prisma.room.findFirst({
        where: {
          roomTypeId: dto.roomTypeId,
          hostelId: user.hostelId,
          NOT: { id },
        },
      });

      if (exists) {
        throw new BadRequestException('Room with that type already exists');
      }
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        roomTypeId: dto.roomTypeId ?? undefined,
        features: dto.featureIds?.length
          ? {
              set: dto.featureIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        roomType: {
          select: {
            name: true,
            slug: true,
            capacity: true,
          },
        },
        features: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    return RoomResponseDto.fromEntity(updated);
  }

  async deleteRoom(id: string, user: JwtPayload): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findFirst({
      where: {
        id,
        hostelId: user.hostelId,
      },
    });

    if (!room) {
      throw new BadRequestException('Room not found or access denied');
    }

    const deleted = await this.prisma.room.delete({
      where: { id },
      include: {
        roomType: {
          select: {
            name: true,
            slug: true,
            capacity: true,
          },
        },
        features: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    return RoomResponseDto.fromEntity(deleted);
  }

  async getRoomById(id: string, user: JwtPayload) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        features: true,
        roomType: true,
      },
    });

    if (!room) throw new NotFoundException('Habitación no encontrada');
    if (room.hostelId !== user.hostelId)
      throw new ForbiddenException('Acceso denegado');

    return room;
  }
}
