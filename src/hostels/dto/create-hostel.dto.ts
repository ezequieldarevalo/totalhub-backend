import { IsString, IsNotEmpty } from 'class-validator';

export class CreateHostelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
