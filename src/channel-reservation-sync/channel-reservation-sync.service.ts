import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChannelReservationSyncDto } from './dto/create-channel-reservation-sync.dto';
import { RawBookingData } from './types/raw-booking-data.interface';

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
    return await this.prisma.channelReservationSync.findFirst({
      where: { externalResId },
    });
  }

  async createReservationFromSync(id: string) {
    const sync = await this.prisma.channelReservationSync.findUnique({
      where: { id },
    });

    if (!sync) throw new NotFoundException('Sync not found');
    if (sync.status !== 'confirmed')
      throw new BadRequestException('Status is not confirmed');

    const rawData = sync.rawData as unknown as RawBookingData;

    const { roomId, startDate, endDate, guests, name, email } = rawData;

    if (!roomId || !startDate || !endDate || !guests) {
      throw new BadRequestException('Missing data in rawData');
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        roomId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        guests,
        name,
        email,
        cancelled: false,
      },
    });

    await this.prisma.channelReservationSync.update({
      where: { id },
      data: { reservationId: reservation.id },
    });

    return reservation;
  }
}
