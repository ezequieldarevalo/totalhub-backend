import { Module } from '@nestjs/common';
import { HostelsService } from './hostels.service';
import { HostelsController } from './hostels.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HostelsController],
  providers: [HostelsService, PrismaService],
})
export class HostelsModule {}
