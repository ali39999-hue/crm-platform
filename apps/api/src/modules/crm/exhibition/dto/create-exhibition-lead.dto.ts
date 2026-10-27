import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { CreateExhibitionLeadRequest, LeadTemperature } from '@crm/contracts';

export class CreateExhibitionLeadDto implements CreateExhibitionLeadRequest {
  @IsString()
  @IsNotEmpty()
  exhibitionName!: string;

  @IsString()
  @IsOptional()
  boothNumber?: string;

  @IsString()
  @IsNotEmpty()
  visitorName!: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsNotEmpty()
  mobilePhone!: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsArray()
  @IsOptional()
  interestProducts?: string[];

  @IsIn(['HOT', 'WARM', 'COLD'])
  temperature!: LeadTemperature;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  sendWelcomeSms?: boolean;
}
