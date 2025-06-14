import { Test, TestingModule } from '@nestjs/testing';
import { ChannelConnectionController } from './channel-connection.controller';

describe('ChannelConnectionController', () => {
  let controller: ChannelConnectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelConnectionController],
    }).compile();

    controller = module.get<ChannelConnectionController>(ChannelConnectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
