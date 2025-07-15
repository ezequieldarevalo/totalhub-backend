import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomTypeId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  featureIds?: string[];
}
