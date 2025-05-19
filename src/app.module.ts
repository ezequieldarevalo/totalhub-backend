import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { RoomsModule } from './rooms/rooms.module';
import { DayPriceModule } from './day-price/day-price.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PublicModule } from './public/public.module';
import { MailModule } from './mail/mail.module';
import { GuestModule } from './guest/guest.module';
import { PaymentsModule } from './payments/payments.module';
import { OperatorModule } from './operator/operator.module';
import { HostelsModule } from './hostels/hostels.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RoomsModule,
    RoomsModule,
    DayPriceModule,
    ReservationsModule,
    PublicModule,
    MailModule,
    GuestModule,
    PaymentsModule,
    OperatorModule,
    HostelsModule,
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService],
})
export class AppModule {}
