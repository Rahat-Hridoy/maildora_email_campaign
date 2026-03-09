import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(1, { message: 'Subject ' })
  subject: string;

  @IsString()
  @MinLength(1, { message: 'Message ' })
  body: string;

  @IsUUID()
  senderEmailId: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
