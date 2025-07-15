import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { RoomTypeResponseDto } from './dto/room-type-response.dto';

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomTypeDto) {
    return this.prisma.roomType.create({ data: dto });
  }

  async findAll() {
    return this.prisma.roomType.findMany();
  }

  async findOne(id: string) {
    const type = await this.prisma.roomType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Room type not found');
    return type;
  }

  async update(
    id: string,
    dto: UpdateRoomTypeDto,
  ): Promise<RoomTypeResponseDto> {
    const existing = await this.prisma.roomType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Room type not found');

    const updated = await this.prisma.roomType.update({
      where: { id },
      data: dto,
    });

    return RoomTypeResponseDto.fromEntity(updated);
  }
}
