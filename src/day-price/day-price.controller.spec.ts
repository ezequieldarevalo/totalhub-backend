import { Test, TestingModule } from '@nestjs/testing';
import { DayPriceController } from './day-price.controller';

describe('DayPriceController', () => {
  let controller: DayPriceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DayPriceController],
    }).compile();

    controller = module.get<DayPriceController>(DayPriceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
