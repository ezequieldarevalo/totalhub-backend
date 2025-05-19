import { Test, TestingModule } from '@nestjs/testing';
import { DayPriceService } from './day-price.service';

describe('DayPriceService', () => {
  let service: DayPriceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DayPriceService],
    }).compile();

    service = module.get<DayPriceService>(DayPriceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
