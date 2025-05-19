import { Test, TestingModule } from '@nestjs/testing';
import { HostelsController } from './hostels.controller';

describe('HostelsController', () => {
  let controller: HostelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HostelsController],
    }).compile();

    controller = module.get<HostelsController>(HostelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
