import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyQueryDto, AllContractsQueryDto } from './dto/query.dto';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async getCompanies(query: CompanyQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { businessNumber: { contains: search } },
        { ceoName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { contracts: true, users: true },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        ceoName: c.ceoName,
        businessNumber: c.businessNumber,
        phone: c.phone,
        status: c.status,
        contractCount: c._count.contracts,
        userCount: c._count.users,
        createdAt: c.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllContracts(query: AllContractsQueryDto) {
    const { search, companyId, status, contractType, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

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
        { employerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      contracts: contracts.map((c) => ({
        id: c.id,
        status: c.status,
        contractType: c.contractType,
        employerName: c.employerName,
        workerName: c.workerName,
        workerPhone: c.workerPhone,
        startDate: c.startDate,
        endDate: c.endDate,
        hourlyWage: c.hourlyWage,
        createdAt: c.createdAt,
        signedAt: c.signedAt,
        solanaTxId: c.solanaTxId,
        company: c.company,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOverallStats() {
    const [
      totalCompanies,
      activeCompanies,
      totalContracts,
      draftCount,
      sentCount,
      signedCount,
      completedCount,
      totalUsers,
      recentCompanies,
      recentContracts,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: 'ACTIVE' } }),
      this.prisma.contract.count(),
      this.prisma.contract.count({ where: { status: 'DRAFT' } }),
      this.prisma.contract.count({ where: { status: 'SENT' } }),
      this.prisma.contract.count({ where: { status: 'SIGNED' } }),
      this.prisma.contract.count({ where: { status: 'COMPLETED' } }),
      this.prisma.user.count(),
      this.prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.contract.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          company: { select: { name: true } },
        },
      }),
    ]);

    return {
      companies: {
        total: totalCompanies,
        active: activeCompanies,
      },
      contracts: {
        total: totalContracts,
        draft: draftCount,
        sent: sentCount,
        signed: signedCount,
        completed: completedCount,
      },
      users: {
        total: totalUsers,
      },
      recentCompanies,
      recentContracts: recentContracts.map((c) => ({
        id: c.id,
        workerName: c.workerName,
        status: c.status,
        companyName: c.company?.name || '-',
        createdAt: c.createdAt,
      })),
    };
  }
}
