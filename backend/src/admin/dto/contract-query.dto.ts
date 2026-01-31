import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ContractQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // 근로자 이름, 전화번호 검색

  @IsOptional()
  @IsIn(['DRAFT', 'SENT', 'SIGNED', 'COMPLETED'])
  status?: string;

  @IsOptional()
  @IsIn(['REGULAR', 'PARTTIME', 'DAILY'])
  contractType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UpdateStatusDto {
  @IsIn(['DRAFT', 'SENT', 'SIGNED', 'COMPLETED'])
  status: string;
}
