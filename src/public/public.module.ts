import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from 'src/mail/mail.module';
import { PublicAvailabilityController } from './public-availability.controller';

@Module({
  imports: [MailModule],
  controllers: [PublicController, PublicAvailabilityController],
  providers: [PublicService, PrismaService],
})
export class PublicModule {}
