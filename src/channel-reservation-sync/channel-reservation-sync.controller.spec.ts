import { Test, TestingModule } from '@nestjs/testing';
import { ChannelReservationSyncController } from './channel-reservation-sync.controller';

describe('ChannelReservationSyncController', () => {
  let controller: ChannelReservationSyncController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelReservationSyncController],
    }).compile();

    controller = module.get<ChannelReservationSyncController>(ChannelReservationSyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
