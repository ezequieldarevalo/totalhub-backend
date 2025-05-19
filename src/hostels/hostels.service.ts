import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHostelDto } from './dto/create-hostel.dto';

@Injectable()
export class HostelsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHostelDto) {
    const existing = await this.prisma.hostel.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un hostel con ese nombre');
    }

    return this.prisma.hostel.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
    });
  }

  async findAll() {
    return this.prisma.hostel.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }
}
