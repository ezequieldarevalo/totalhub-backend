import { Module } from '@nestjs/common';
import { RoomFeaturesService } from './room-features.service';
import { RoomFeaturesController } from './room-features.controller';

@Module({
  providers: [RoomFeaturesService],
  controllers: [RoomFeaturesController]
})
export class RoomFeaturesModule {}
