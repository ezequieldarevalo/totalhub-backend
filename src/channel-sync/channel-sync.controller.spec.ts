import { Test, TestingModule } from '@nestjs/testing';
import { ChannelSyncController } from './channel-sync.controller';

describe('ChannelSyncController', () => {
  let controller: ChannelSyncController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelSyncController],
    }).compile();

    controller = module.get<ChannelSyncController>(ChannelSyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
