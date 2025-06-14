import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateChannelConnectionDto {
  @IsString()
  hostelId: string;

  @IsString()
  channelId: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  credentials?: any;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
