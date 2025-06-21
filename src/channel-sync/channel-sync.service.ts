import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ReservationsService } from '../reservations/reservations.service';

interface SyncLogFilters {
  status?: string;
  externalResId?: string;
}

export interface RawBookingData {
  roomId: string;
  startDate: string;
  endDate: string;
  guests: number;
  name?: string;
  email?: string;
}

@Injectable()
export class ChannelSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
  ) {}

  // src/channel-sync/channel-sync.service.ts
  async getSyncLogsByHostel(
    hostelId: string,
    filters: SyncLogFilters,
    page = 1,
    limit = 20,
  ) {
    const where: Prisma.ChannelReservationSyncWhereInput = {
      connection: {
        hostelId,
      },
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.externalResId) {
      where.externalResId = {
        contains: filters.externalResId,
        mode: 'insensitive',
      };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.channelReservationSync.count({ where }),
      this.prisma.channelReservationSync.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      items,
    };
  }

  async getConfirmedReservations(hostelId: string) {
    return this.prisma.channelReservationSync.findMany({
      where: {
        status: 'confirmed',
        reservationId: { not: null },
        connection: {
          hostelId,
        },
      },
      include: {
        reservation: {
          include: {
            room: true,
          },
        },
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

  async retrySync(id: string) {
    const sync = await this.prisma.channelReservationSync.findUnique({
      where: { id },
      include: {
        connection: true,
      },
    });

    if (!sync) throw new BadRequestException('Sync log not found');

    if (sync.status === 'synced') {
      throw new BadRequestException('Reservation already synced');
    }

    try {
      const reservation =
        await this.reservationsService.createReservationFromSync({
          rawData: sync.rawData as unknown as RawBookingData,
        });

      await this.prisma.channelReservationSync.update({
        where: { id },
        data: {
          reservationId: reservation.id,
          status: 'synced',
        },
      });

      return { message: 'Reservation synced', reservationId: reservation.id };
    } catch (error) {
      await this.prisma.channelReservationSync.update({
        where: { id },
        data: {
          status: 'error',
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error.message || 'Sync failed');
    }
  }
}
