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
import { AdminUsersModule } from './admin-users/admin-users.module';
import { ChannelModule } from './channel/channel.module';
import { ChannelConnectionModule } from './channel-connection/channel-connection.module';
import { ChannelReservationSyncModule } from './channel-reservation-sync/channel-reservation-sync.module';
import { ExternalModule } from './external/external.module';
import { ChannelSyncModule } from './channel-sync/channel-sync.module';
import { RoomTypesModule } from './room-types/room-types.module';
import { RoomFeaturesModule } from './room-features/room-features.module';

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
    AdminUsersModule,
    ChannelModule,
    ChannelConnectionModule,
    ChannelReservationSyncModule,
    ExternalModule,
    ChannelSyncModule,
    RoomTypesModule,
    RoomFeaturesModule,
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService],
})
export class AppModule {}
