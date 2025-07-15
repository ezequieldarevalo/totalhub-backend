import { Test, TestingModule } from '@nestjs/testing';
import { RoomFeaturesService } from './room-features.service';

describe('RoomFeaturesService', () => {
  let service: RoomFeaturesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomFeaturesService],
    }).compile();

    service = module.get<RoomFeaturesService>(RoomFeaturesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
