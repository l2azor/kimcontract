import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class SignupDto {
  // 사용자 정보
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  password: string;

  // 회사 정보
  @IsString()
  @IsNotEmpty({ message: '회사명을 입력해주세요' })
  companyName: string;

  @IsString()
  @IsNotEmpty({ message: '대표자명을 입력해주세요' })
  ceoName: string;

  @IsString()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, { message: '사업자등록번호 형식이 올바르지 않습니다 (000-00-00000)' })
  businessNumber: string;

  @IsString()
  @IsNotEmpty({ message: '주소를 입력해주세요' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: '연락처를 입력해주세요' })
  phone: string;
}
