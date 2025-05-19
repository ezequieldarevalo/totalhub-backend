import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';

@Module({
  providers: [OperatorService],
  controllers: [OperatorController],
})
export class OperatorModule {}
