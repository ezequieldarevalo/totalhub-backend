import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomTypeDto } from './create-room-type.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateRoomTypeDto extends PartialType(CreateRoomTypeDto) {}
