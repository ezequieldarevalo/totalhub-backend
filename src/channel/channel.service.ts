import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChannelDto) {
    return await this.prisma.channel.create({ data: dto });
  }

  async findAll() {
    return await this.prisma.channel.findMany({ orderBy: { name: 'asc' } });
  }

  async findByCode(code: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { code },
    });
    if (!channel) {
      throw new NotFoundException(`Channel with code '${code}' not found`);
    }
    return channel;
  }
}
