import { Test, TestingModule } from '@nestjs/testing';
import { ChannelReservationSyncService } from './channel-reservation-sync.service';

describe('ChannelReservationSyncService', () => {
  let service: ChannelReservationSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelReservationSyncService],
    }).compile();

    service = module.get<ChannelReservationSyncService>(ChannelReservationSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
