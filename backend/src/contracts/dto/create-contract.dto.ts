import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsDateString,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateContractDto {
  @IsIn(['REGULAR', 'PARTTIME', 'DAILY'])
  contractType: string;

  // 고용주 정보
  @IsString()
  employerName: string;

  @IsString()
  employerCeo: string;

  @IsString()
  employerAddress: string;

  @IsString()
  employerPhone: string;

  // 근로자 정보
  @IsString()
  workerName: string;

  @IsString()
  workerBirth: string;

  @IsString()
  workerPhone: string;

  @IsString()
  workerAddress: string;

  // 근무 조건
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsArray()
  @IsString({ each: true })
  workDays: string[];

  @IsString()
  workStart: string;

  @IsString()
  workEnd: string;

  @IsInt()
  @Min(0)
  breakTime: number;

  @IsInt()
  @Min(0)
  hourlyWage: number;

  @IsInt()
  @Min(1)
  @Max(31)
  payDay: number;

  @IsOptional()
  @IsString()
  specialTerms?: string;
}
