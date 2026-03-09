import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsEmail({}, { message: 'Enter Valid email' })
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}
