import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  unsubscribed?: boolean;
}
