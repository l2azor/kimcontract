import { Contract } from '@prisma/client';

// Prisma Contract 타입을 기반으로 한 포맷팅된 계약서 타입
export interface FormattedContract extends Omit<Contract, 'workDays'> {
  workDays: string[];
}
