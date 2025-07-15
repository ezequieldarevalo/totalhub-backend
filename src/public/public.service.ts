import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseISO, eachDayOfInterval, addDays, isValid } from 'date-fns';
import {
  PaymentMethod,
  PublicCreateReservationDto,
} from './dto/public-create-reservation.dto';
import { Lang, MailService, RoomSlug } from 'src/mail/mail.service';

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
          include: {
            roomType: true,
          },
          orderBy: {
            roomType: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!hostel) {
      return {
        hostel: null,
        rooms: [],
      };
    }

    return {
      hostel: {
        name: hostel.name,
        slug: hostel.slug,
      },
      rooms: hostel.rooms.map((room) => ({
        id: room.id,
        name: room.roomType?.name ?? '—',
        slug: room.roomType?.slug ?? '',
        capacity: room.roomType?.capacity ?? 0,
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

  async getRoomBySlug(slug: string, roomSlug: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        hostel: {
          slug,
        },
        roomType: {
          slug: roomSlug,
        },
      },
      include: {
        hostel: {
          select: {
            name: true,
            slug: true,
          },
        },
        roomType: true,
        images: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return {
      id: room.id,
      name: room.roomType?.name ?? '—',
      slug: room.roomType?.slug ?? '',
      description: room.description,
      capacity: room.roomType?.capacity ?? 0,
      hostel: room.hostel,
      photos: room.images.map((img) => img.url),
    };
  }

  async getAvailabilityBySlug(slug: string, from: string, to: string) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { slug },
      include: {
        rooms: {
          include: {
            features: true,
            images: true,
            roomType: true,
          },
        },
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
      features: { id: string; slug: string }[];
      images: {
        id: string;
        url: string;
        order: number;
        roomId: string;
      }[];
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
        continue;
      }

      const reservations = await this.prisma.reservation.findMany({
        where: {
          roomId: room.id,
          startDate: { lt: toDate },
          endDate: { gt: fromDate },
        },
      });

      const isAvailableAllDays = days.every((day) => {
        const dayStr = day.toISOString().split('T')[0];
        const price = prices.find(
          (p) => p.date.toISOString().split('T')[0] === dayStr,
        );
        if (!price) return false;

        const maxCapacity =
          price.availableCapacity ?? room.roomType?.capacity ?? 0;

        const guestsThatDay = reservations
          .filter((r) => r.startDate <= day && r.endDate > day)
          .reduce((sum, r) => sum + r.guests, 0);

        return guestsThatDay < maxCapacity;
      });

      if (!isAvailableAllDays) continue;

      const totalPrice = prices.reduce((acc, p) => acc + p.price, 0);

      result.push({
        id: room.id,
        name: room.roomType?.name ?? '—',
        slug: room.roomType?.slug ?? '',
        capacity: room.roomType?.capacity ?? 0,
        price: totalPrice,
        images: room.images,
        features: room.features,
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
      include: {
        roomType: true,
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

    for (const day of days) {
      const price = prices.find(
        (p) =>
          p.date.toISOString().split('T')[0] ===
          day.toISOString().split('T')[0],
      );

      const maxCapacity =
        price?.availableCapacity ?? room.roomType?.capacity ?? 0;

      if (dto.guests > maxCapacity) {
        throw new BadRequestException(
          `No availability for ${day.toISOString().split('T')[0]}`,
        );
      }
    }

    if (dto.isResident && dto.hasMuchiCard) {
      throw new BadRequestException(
        'MuchiCard solo aplica a turistas no residentes',
      );
    }

    // PRECIO BASE
    let baseTotal = prices.reduce((acc, p) => acc + p.price, 0) * dto.guests;

    // Turista con MuchiCard
    if (!dto.isResident && dto.hasMuchiCard) {
      if (dto.muchiCardType === 'cash') {
        baseTotal *= 0.85;
      } else if (dto.muchiCardType === 'debit') {
        baseTotal *= 0.9;
      } else if (dto.muchiCardType === 'credit') {
        baseTotal *= 0.95;
      }
    }

    // Residente con tarjeta (IVA)
    if (dto.isResident && dto.paymentMethod === PaymentMethod.CARD) {
      baseTotal *= 1.3333;
    }

    // Redondeo a dos decimales
    const total = parseFloat(baseTotal.toFixed(2));

    const reservation = await this.prisma.reservation.create({
      data: {
        roomId: room.id,
        startDate: fromDate,
        endDate: toDate,
        guests: dto.guests,
        name: dto.name,
        email: dto.email,
        totalPrice: total,
      },
    });

    // Actualizar disponibilidad
    for (const day of days) {
      await this.prisma.dayPrice.updateMany({
        where: {
          roomId: room.id,
          date: day,
        },
        data: {
          availableCapacity: {
            decrement: dto.guests,
          },
        },
      });
    }

    // Enviar mail
    await this.mailService.sendReservationConfirmation({
      to: dto.email,
      name: dto.name,
      roomSlug: room?.roomType?.slug as RoomSlug,
      from: dto.from,
      toDate: dto.to,
      guests: dto.guests,
      total,
      lang: dto.lang as Lang,
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
          include: {
            roomType: {
              select: {
                name: true,
                slug: true,
              },
            },
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
      room: r.room.roomType?.name ?? '—',
      roomSlug: r.room.roomType?.slug ?? '',
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
        rooms: {
          include: {
            roomType: true,
          },
        },
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

          return guestsThatDay + guests <= (room.roomType?.capacity ?? 0);
        });

        if (isAvailable) {
          const totalPrice =
            prices.reduce((acc, p) => acc + p.price, 0) * guests;

          availableRooms.push({
            id: room.id,
            name: room.roomType?.name ?? '—',
            slug: room.roomType?.slug ?? '',
            capacity: room.roomType?.capacity ?? 0,
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

  async getReservationPreview({
    slug,
    roomId,
    from,
    to,
    guests,
    isResident,
    paymentMethod,
    hasMuchiCard,
    muchiCardType,
  }: {
    slug: string;
    roomId: string;
    from: string;
    to: string;
    guests: number;
    isResident: boolean;
    paymentMethod?: 'cash' | 'card';
    hasMuchiCard?: boolean;
    muchiCardType?: 'cash' | 'debit' | 'credit';
  }) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!hostel) {
      throw new NotFoundException('Hostel not found');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        hostelId: hostel.id,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
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

    const breakdown = days.map((day) => {
      const price = prices.find(
        (p) =>
          p.date.toISOString().split('T')[0] ===
          day.toISOString().split('T')[0],
      );

      let base = (price?.price ?? 0) * guests;

      // Aplicar IVA solo a residentes con tarjeta
      if (isResident && paymentMethod === 'card') {
        base *= 1.3333;
      }

      // Descuento MuchiCard solo si NO es residente
      if (!isResident && hasMuchiCard) {
        if (muchiCardType === 'cash') {
          base *= 0.85;
        } else if (muchiCardType === 'debit') {
          base *= 0.9;
        } else if (muchiCardType === 'credit') {
          base *= 0.95;
        }
      }

      return {
        date: day.toISOString().split('T')[0],
        finalPrice: parseFloat(base.toFixed(2)),
      };
    });

    const total = breakdown.reduce((acc, item) => acc + item.finalPrice, 0);

    return {
      total: parseFloat(total.toFixed(2)),
      breakdown,
    };
  }
}
