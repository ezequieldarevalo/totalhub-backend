import { IsString, IsObject } from 'class-validator';

export class CreateChannelReservationSyncDto {
  @IsString()
  connectionId: string;

  @IsString()
  externalResId: string;

  @IsString()
  status: string;

  @IsObject()
  rawData: object;
}
