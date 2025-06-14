import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChannelReservationSyncDto } from './dto/create-channel-reservation-sync.dto';

@Injectable()
export class ChannelReservationSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChannelReservationSyncDto) {
    return await this.prisma.channelReservationSync.create({
      data: {
        connectionId: dto.connectionId,
        externalResId: dto.externalResId,
        status: dto.status,
        rawData: dto.rawData,
      },
    });
  }

  async findAll() {
    return await this.prisma.channelReservationSync.findMany({
      include: {
        connection: {
          include: { hostel: true, channel: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByExternalId(externalResId: string) {
    const reservation = await this.prisma.channelReservationSync.findFirst({
      where: { externalResId },
    });

    if (!reservation) {
      throw new NotFoundException(
        `External reservation '${externalResId}' not found`,
      );
    }

    return reservation;
  }
}
