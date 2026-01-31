import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractQueryDto, UpdateStatusDto } from './dto/contract-query.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getContracts(companyId: string, query: ContractQueryDto) {
    const { search, status, contractType, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    if (contractType) {
      where.contractType = contractType;
    }

    if (search) {
      where.OR = [
        { workerName: { contains: search, mode: 'insensitive' } },
        { workerPhone: { contains: search } },
      ];
    }

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          contractType: true,
          employerName: true,
          workerName: true,
          workerPhone: true,
          startDate: true,
          endDate: true,
          hourlyWage: true,
          createdAt: true,
          signedAt: true,
          solanaTxId: true,
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContractDetail(companyId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다');
    }

    if (contract.companyId !== companyId) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }

    return contract;
  }

  async updateContractStatus(companyId: string, contractId: string, dto: UpdateStatusDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다');
    }

    if (contract.companyId !== companyId) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }

    return this.prisma.contract.update({
      where: { id: contractId },
      data: { status: dto.status },
    });
  }

  async deleteContract(companyId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다');
    }

    if (contract.companyId !== companyId) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }

    await this.prisma.contract.delete({
      where: { id: contractId },
    });

    return { message: '계약서가 삭제되었습니다' };
  }

  async getStats(companyId: string) {
    const [
      totalContracts,
      draftCount,
      sentCount,
      signedCount,
      completedCount,
      recentContracts,
      monthlyStats,
    ] = await Promise.all([
      // 전체 계약서 수
      this.prisma.contract.count({ where: { companyId } }),
      // 상태별 수
      this.prisma.contract.count({ where: { companyId, status: 'DRAFT' } }),
      this.prisma.contract.count({ where: { companyId, status: 'SENT' } }),
      this.prisma.contract.count({ where: { companyId, status: 'SIGNED' } }),
      this.prisma.contract.count({ where: { companyId, status: 'COMPLETED' } }),
      // 최근 계약서 5건
      this.prisma.contract.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          workerName: true,
          status: true,
          createdAt: true,
        },
      }),
      // 최근 6개월 월별 통계
      this.getMonthlyStats(companyId),
    ]);

    return {
      overview: {
        total: totalContracts,
        draft: draftCount,
        sent: sentCount,
        signed: signedCount,
        completed: completedCount,
      },
      recentContracts,
      monthlyStats,
    };
  }

  private async getMonthlyStats(companyId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const contracts = await this.prisma.contract.findMany({
      where: {
        companyId,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // 월별로 그룹화
    const monthlyData: { [key: string]: { created: number; completed: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { created: 0, completed: 0 };
    }

    contracts.forEach((contract) => {
      const key = `${contract.createdAt.getFullYear()}-${String(contract.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].created++;
        if (contract.status === 'COMPLETED') {
          monthlyData[key].completed++;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));
  }
}
