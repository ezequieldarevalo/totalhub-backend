import { Test, TestingModule } from '@nestjs/testing';
import { PublicAvailabilityController } from './public-availability.controller';

describe('PublicAvailabilityController', () => {
  let controller: PublicAvailabilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicAvailabilityController],
    }).compile();

    controller = module.get<PublicAvailabilityController>(
      PublicAvailabilityController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
