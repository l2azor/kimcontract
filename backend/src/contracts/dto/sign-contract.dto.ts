import { IsString } from 'class-validator';

export class SignContractDto {
  @IsString()
  signature: string; // Base64 이미지
}
