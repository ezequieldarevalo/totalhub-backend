import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, creatorUser: JwtPayload) {
    if (creatorUser.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create users');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        hostelId: creatorUser.hostelId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }
}
