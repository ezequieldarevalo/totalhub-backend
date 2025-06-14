import { Test, TestingModule } from '@nestjs/testing';
import { ChannelConnectionService } from './channel-connection.service';

describe('ChannelConnectionService', () => {
  let service: ChannelConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelConnectionService],
    }).compile();

    service = module.get<ChannelConnectionService>(ChannelConnectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
