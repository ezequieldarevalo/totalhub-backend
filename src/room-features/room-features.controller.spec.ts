import { Test, TestingModule } from '@nestjs/testing';
import { RoomFeaturesController } from './room-features.controller';

describe('RoomFeaturesController', () => {
  let controller: RoomFeaturesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomFeaturesController],
    }).compile();

    controller = module.get<RoomFeaturesController>(RoomFeaturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
