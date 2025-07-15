import { IsUUID } from 'class-validator';

export class CreateRoomFeatureDto {
  @IsUUID()
  roomId: string;

  @IsUUID()
  featureId: string;
}
