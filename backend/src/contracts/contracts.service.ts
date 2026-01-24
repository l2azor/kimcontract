import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Contract } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { FormattedContract } from './types';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  // 계약서 생성
  async create(dto: CreateContractDto) {
    const contract = await this.prisma.contract.create({
      data: {
        contractType: dto.contractType,
        employerName: dto.employerName,
        employerCeo: dto.employerCeo,
        employerAddress: dto.employerAddress,
        employerPhone: dto.employerPhone,
        workerName: dto.workerName,
        workerBirth: dto.workerBirth,
        workerPhone: dto.workerPhone,
        workerAddress: dto.workerAddress,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        workDays: JSON.stringify(dto.workDays),
        workStart: dto.workStart,
        workEnd: dto.workEnd,
        breakTime: dto.breakTime,
        hourlyWage: dto.hourlyWage,
        payDay: dto.payDay,
        specialTerms: dto.specialTerms,
      },
    });

    return this.formatContract(contract);
  }

  // 계약서 조회
  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    return this.formatContract(contract);
  }

  // 고용주 서명
  async employerSign(id: string, signature: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    if (contract.status !== 'DRAFT') {
      throw new BadRequestException('이미 서명된 계약서입니다.');
    }

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        employerSign: signature,
        status: 'SENT',
      },
    });

    return this.formatContract(updated);
  }

  // 근로자 서명
  async workerSign(id: string, signature: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    if (contract.status !== 'SENT') {
      throw new BadRequestException('고용주 서명이 먼저 필요합니다.');
    }

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        workerSign: signature,
        status: 'SIGNED',
        signedAt: new Date(),
      },
    });

    return this.formatContract(updated);
  }

  // 블록체인 기록 완료 처리
  async complete(id: string, pdfHash: string, solanaTxId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        pdfHash,
        solanaTxId,
        status: 'COMPLETED',
      },
    });

    return this.formatContract(updated);
  }

  // 계약서 데이터 포맷팅
  private formatContract(contract: Contract): FormattedContract {
    return {
      ...contract,
      workDays: JSON.parse(contract.workDays) as string[],
    };
  }
}
