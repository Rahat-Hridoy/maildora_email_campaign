import { IsEmail } from 'class-validator';

export class CreateSenderEmailDto {
  @IsEmail({}, { message: 'Input Valid Email' })
  email: string;
}
