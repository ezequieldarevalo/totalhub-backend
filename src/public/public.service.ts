import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseISO, eachDayOfInterval, addDays, isValid } from 'date-fns';
import { PublicCreateReservationDto } from './dto/public-create-reservation.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getRoomsBySlug(slug: string) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { slug },
      include: {
        rooms: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!hostel) return { rooms: [] };

    return {
      hostel: {
        name: hostel.name,
        slug: hostel.slug,
      },
      rooms: hostel.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        slug: room.slug,
        capacity: room.capacity,
      })),
    };
  }

  async getAllHostels() {
    const hostels = await this.prisma.hostel.findMany({
      orderBy: { name: 'asc' },
      select: {
        name: true,
        slug: true,
      },
    });

    return hostels;
  }

  async getRoomBySlug(hostelSlug: string, roomSlug: string) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { slug: hostelSlug },
      select: { id: true },
    });

    if (!hostel) {
      throw new NotFoundException('Hostel not found');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        slug: roomSlug,
        hostelId: hostel.id,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async getAvailabilityBySlug(slug: string, from: string, to: string) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { slug },
      include: {
        rooms: true,
      },
    });

    if (!hostel) {
      throw new NotFoundException('Hostel not found');
    }

    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (!isValid(fromDate) || !isValid(toDate) || fromDate >= toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const days = eachDayOfInterval({
      start: fromDate,
      end: addDays(toDate, -1),
    });

    const result: {
      id: string;
      name: string;
      slug: string;
      capacity: number;
      price: number;
    }[] = [];

    for (const room of hostel.rooms) {
      const prices = await this.prisma.dayPrice.findMany({
        where: {
          roomId: room.id,
          date: {
            gte: fromDate,
            lt: toDate,
          },
        },
      });

      if (prices.length !== days.length) {
        continue; // no tarifa para todos los días
      }

      const reservations = await this.prisma.reservation.findMany({
        where: {
          roomId: room.id,
          startDate: { lt: toDate },
          endDate: { gt: fromDate },
        },
      });

      const isAvailableAllDays = days.every((day) => {
        const guestsThatDay = reservations
          .filter((r) => r.startDate <= day && r.endDate > day)
          .reduce((sum, r) => sum + r.guests, 0);

        return guestsThatDay < room.capacity;
      });

      if (!isAvailableAllDays) continue;

      const totalPrice = prices.reduce((acc, p) => acc + p.price, 0);

      result.push({
        id: room.id,
        name: room.name,
        slug: room.slug,
        capacity: room.capacity,
        price: totalPrice,
      });
    }

    return {
      hostel: {
        name: hostel.name,
        slug: hostel.slug,
      },
      availableRooms: result,
    };
  }

  async createReservation(slug: string, dto: PublicCreateReservationDto) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!hostel) {
      throw new NotFoundException('Hostel not found');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        id: dto.roomId,
        hostelId: hostel.id,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const fromDate = parseISO(dto.from);
    const toDate = parseISO(dto.to);

    if (!isValid(fromDate) || !isValid(toDate) || fromDate >= toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const days = eachDayOfInterval({
      start: fromDate,
      end: addDays(toDate, -1),
    });

    const prices = await this.prisma.dayPrice.findMany({
      where: {
        roomId: room.id,
        date: {
          gte: fromDate,
          lt: toDate,
        },
      },
    });

    if (prices.length !== days.length) {
      throw new BadRequestException(
        'Missing prices for some days in the selected range',
      );
    }

    const reservations = await this.prisma.reservation.findMany({
      where: {
        roomId: room.id,
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
      },
    });

    for (const day of days) {
      const guestsThatDay = reservations
        .filter((r) => r.startDate <= day && r.endDate > day)
        .reduce((sum, r) => sum + r.guests, 0);

      if (guestsThatDay + dto.guests > room.capacity) {
        throw new BadRequestException(
          `No availability for ${day.toISOString().split('T')[0]}`,
        );
      }
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        roomId: room.id,
        startDate: fromDate,
        endDate: toDate,
        guests: dto.guests,
        name: dto.name,
        email: dto.email,
      },
    });

    const total = prices.reduce((acc, p) => acc + p.price, 0) * dto.guests;

    await this.mailService.sendReservationConfirmation({
      to: dto.email,
      name: dto.name,
      room: room.name,
      from: dto.from,
      toDate: dto.to,
      guests: dto.guests,
      total,
    });

    return {
      reservation,
      total,
    };
  }

  async lookupReservationsByEmail(email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Email inválido');
    }

    const reservations = await this.prisma.reservation.findMany({
      where: { email },
      include: {
        room: {
          select: {
            name: true,
            slug: true,
            hostel: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return reservations.map((r) => ({
      id: r.id,
      from: r.startDate,
      to: r.endDate,
      guests: r.guests,
      room: r.room.name,
      roomSlug: r.room.slug,
      hostel: r.room.hostel.name,
      hostelSlug: r.room.hostel.slug,
      createdAt: r.createdAt,
    }));
  }

  async getAllAvailability(from: string, to: string, guests: number) {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (!isValid(fromDate) || !isValid(toDate) || fromDate >= toDate) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    const days = eachDayOfInterval({
      start: fromDate,
      end: addDays(toDate, -1),
    });

    const hostels = await this.prisma.hostel.findMany({
      include: {
        rooms: true,
      },
    });

    const result: {
      name: string;
      slug: string;
      availableRooms: {
        id: string;
        name: string;
        slug: string;
        capacity: number;
        price: number;
      }[];
    }[] = [];

    for (const hostel of hostels) {
      const availableRooms: {
        id: string;
        name: string;
        slug: string;
        capacity: number;
        price: number;
      }[] = [];

      for (const room of hostel.rooms) {
        const prices = await this.prisma.dayPrice.findMany({
          where: {
            roomId: room.id,
            date: {
              gte: fromDate,
              lt: toDate,
            },
          },
        });

        if (prices.length !== days.length) continue;

        const reservations = await this.prisma.reservation.findMany({
          where: {
            roomId: room.id,
            startDate: { lt: toDate },
            endDate: { gt: fromDate },
          },
        });

        const isAvailable = days.every((day) => {
          const guestsThatDay = reservations
            .filter((r) => r.startDate <= day && r.endDate > day)
            .reduce((sum, r) => sum + r.guests, 0);

          return guestsThatDay + guests <= room.capacity;
        });

        if (isAvailable) {
          const totalPrice =
            prices.reduce((acc, p) => acc + p.price, 0) * guests;
          availableRooms.push({
            id: room.id,
            name: room.name,
            slug: room.slug,
            capacity: room.capacity,
            price: totalPrice,
          });
        }
      }

      if (availableRooms.length > 0) {
        result.push({
          name: hostel.name,
          slug: hostel.slug,
          availableRooms,
        });
      }
    }

    return result;
  }
}
