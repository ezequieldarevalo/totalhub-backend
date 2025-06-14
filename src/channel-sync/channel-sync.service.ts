import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChannelSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async getSyncLogsByHostel(hostelId: string) {
    return this.prisma.channelReservationSync.findMany({
      where: {
        connection: {
          hostelId,
        },
      },
      include: {
        connection: {
          select: {
            channel: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
