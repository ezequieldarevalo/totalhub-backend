import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChannelConnectionDto } from './dto/create-channel-connection.dto';

@Injectable()
export class ChannelConnectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChannelConnectionDto) {
    return await this.prisma.channelConnection.create({
      data: {
        hostelId: dto.hostelId,
        channelId: dto.channelId,
        externalId: dto.externalId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        credentials: dto.credentials,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async findAll() {
    return await this.prisma.channelConnection.findMany({
      include: {
        channel: true,
        hostel: true,
      },
    });
  }

  async findByHostel(hostelId: string) {
    return await this.prisma.channelConnection.findMany({
      where: { hostelId },
      include: {
        channel: true,
      },
    });
  }

  async findOne(id: string) {
    const conn = await this.prisma.channelConnection.findUnique({
      where: { id },
      include: { channel: true, hostel: true },
    });

    if (!conn) {
      throw new NotFoundException(
        `ChannelConnection with id '${id}' not found`,
      );
    }

    return conn;
  }
}
