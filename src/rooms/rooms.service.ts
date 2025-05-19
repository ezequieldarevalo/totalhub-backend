import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateRoomDto } from './dto/update-room.dto';
import { normalizeSlug } from '../utils/slug.util';
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

    const normalizedSlug = normalizeSlug(dto.slug);

    const exists = await this.prisma.room.findFirst({
      where: {
        slug: normalizedSlug,
        hostelId: user.hostelId,
      },
    });

    if (exists) throw new BadRequestException('Room slug already in use');

    const created = await this.prisma.room.create({
      data: {
        name: dto.name,
        slug: normalizedSlug,
        capacity: dto.capacity,
        hostelId: user.hostelId,
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
      orderBy: {
        name: 'asc',
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

    if (dto.slug) {
      const normalizedSlug = normalizeSlug(dto.slug);

      const exists = await this.prisma.room.findFirst({
        where: {
          slug: normalizedSlug,
          hostelId: user.hostelId,
          NOT: { id },
        },
      });

      if (exists) {
        throw new BadRequestException('Room slug already in use');
      }

      dto.slug = normalizedSlug;
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: dto,
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
    });

    return RoomResponseDto.fromEntity(deleted);
  }
}
