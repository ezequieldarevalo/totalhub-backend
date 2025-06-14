import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelReservationSyncService } from 'src/channel-reservation-sync/channel-reservation-sync.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookingReservationDto } from './dto/booking-reservation.dto';

@Injectable()
export class ExternalService {
  constructor(
    private readonly syncService: ChannelReservationSyncService,
    private readonly prisma: PrismaService,
  ) {}

  async processBookingReservation(payload: BookingReservationDto) {
    const { externalResId, connectionId, status, rawData } = payload;

    const existing = await this.prisma.channelReservationSync.findFirst({
      where: { externalResId },
    });

    if (existing) {
      return { message: 'Reservation already synced', id: existing.id };
    }

    await this.syncService.create({
      connectionId,
      externalResId,
      status,
      rawData,
    });

    const reservation = await this.prisma.reservation.create({
      data: {
        startDate: new Date(rawData.startDate),
        endDate: new Date(rawData.endDate),
        guests: rawData.guests,
        roomId: rawData.roomId,
        name: rawData.name,
        email: rawData.email,
      },
    });

    return { message: 'Reservation created', reservationId: reservation.id };
  }

  async getSyncedReservations(hostelId?: string, externalResId?: string) {
    return await this.prisma.channelReservationSync.findMany({
      where: {
        ...(externalResId ? { externalResId } : {}),
        ...(hostelId ? { connection: { hostelId } } : {}),
      },
      include: {
        connection: {
          include: {
            channel: true,
            hostel: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAvailability(hostelId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const rooms = await this.prisma.room.findMany({
      where: { hostelId },
      include: {
        reservations: {
          where: {
            cancelled: false,
            OR: [{ startDate: { lt: toDate }, endDate: { gt: fromDate } }],
          },
        },
      },
    });

    const result: {
      roomId: string;
      date: string;
      availableUnits: number;
    }[] = [];

    for (const room of rooms) {
      const days = this.eachDayBetween(fromDate, toDate);

      for (const date of days) {
        const activeReservations = room.reservations.filter(
          (r) => r.startDate <= date && r.endDate > date,
        ).length;

        result.push({
          roomId: room.id,
          date: date.toISOString().split('T')[0],
          availableUnits: Math.max(room.capacity - activeReservations, 0),
        });
      }
    }

    return result;
  }

  private eachDayBetween(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      days.push(new Date(current.getTime()));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  async getPrices(hostelId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const rooms = await this.prisma.room.findMany({
      where: { hostelId },
      select: {
        id: true,
        dayPrices: {
          where: {
            date: { gte: fromDate, lte: toDate },
            active: true,
          },
          select: {
            date: true,
            price: true,
          },
        },
      },
    });

    const result: {
      roomId: string;
      date: string;
      price: number;
    }[] = [];

    for (const room of rooms) {
      for (const day of room.dayPrices) {
        result.push({
          roomId: room.id,
          date: day.date.toISOString().split('T')[0],
          price: day.price,
        });
      }
    }

    return result;
  }

  async assignExternalRoomId(roomId: string, externalRoomId: string) {
    return await this.prisma.room.update({
      where: { id: roomId },
      data: { externalRoomId },
    });
  }

  async getConnectionById(connectionId: string) {
    return this.prisma.channelConnection.findUnique({
      where: { id: connectionId },
      select: { hostelId: true },
    });
  }
}
