import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    // 이메일 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 사업자등록번호 중복 확인
    const existingCompany = await this.prisma.company.findUnique({
      where: { businessNumber: dto.businessNumber },
    });

    if (existingCompany) {
      throw new ConflictException('이미 등록된 사업자등록번호입니다');
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 회사와 사용자 생성
    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        ceoName: dto.ceoName,
        businessNumber: dto.businessNumber,
        address: dto.address,
        phone: dto.phone,
        users: {
          create: {
            email: dto.email,
            password: hashedPassword,
            role: 'COMPANY_ADMIN',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = company.users[0];

    // JWT 토큰 생성
    const token = this.generateToken(user.id, user.email, company.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      company: {
        id: company.id,
        name: company.name,
        ceoName: company.ceoName,
        businessNumber: company.businessNumber,
        address: company.address,
        phone: company.phone,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    // 사용자 찾기
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // JWT 토큰 생성
    const token = this.generateToken(user.id, user.email, user.companyId);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        ceoName: user.company.ceoName,
        businessNumber: user.company.businessNumber,
        address: user.company.address,
        phone: user.company.phone,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      company: {
        id: user.company.id,
        name: user.company.name,
        ceoName: user.company.ceoName,
        businessNumber: user.company.businessNumber,
        address: user.company.address,
        phone: user.company.phone,
      },
    };
  }

  private generateToken(userId: string, email: string, companyId: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      companyId,
    });
  }
}
