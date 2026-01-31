import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
});

export interface Contract {
  id: string;
  status: string;
  contractType: string;
  employerName: string;
  employerCeo: string;
  employerAddress: string;
  employerPhone: string;
  workerName: string;
  workerBirth: string;
  workerPhone: string;
  workerAddress: string;
  startDate: string;
  endDate?: string;
  workDays: string[];
  workStart: string;
  workEnd: string;
  breakTime: number;
  hourlyWage: number;
  payDay: number;
  specialTerms?: string;
  employerSign?: string;
  workerSign?: string;
  pdfHash?: string;
  solanaTxId?: string;
  createdAt: string;
  signedAt?: string;
}

export interface CreateContractDto {
  contractType: string;
  employerName: string;
  employerCeo: string;
  employerAddress: string;
  employerPhone: string;
  workerName: string;
  workerBirth: string;
  workerPhone: string;
  workerAddress: string;
  startDate: string;
  endDate?: string;
  workDays: string[];
  workStart: string;
  workEnd: string;
  breakTime: number;
  hourlyWage: number;
  payDay: number;
  specialTerms?: string;
}

export const contractApi = {
  // 계약서 생성
  create: async (data: CreateContractDto) => {
    const res = await api.post<{ success: boolean; data: Contract }>('/contracts', data);
    return res.data;
  },

  // 계약서 조회
  get: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Contract }>(`/contracts/${id}`);
    return res.data;
  },

  // 고용주 서명
  employerSign: async (id: string, signature: string) => {
    const res = await api.patch<{ success: boolean; data: Contract }>(
      `/contracts/${id}/employer-sign`,
      { signature }
    );
    return res.data;
  },

  // 근로자 서명
  workerSign: async (id: string, signature: string) => {
    const res = await api.patch<{ success: boolean; data: Contract }>(
      `/contracts/${id}/worker-sign`,
      { signature }
    );
    return res.data;
  },

  // PDF 다운로드 URL
  getPdfUrl: (id: string) => {
    return `${api.defaults.baseURL}/contracts/${id}/pdf`;
  },

  // 검증
  verify: async (id: string) => {
    const res = await api.get<{
      success: boolean;
      data?: {
        isValid: boolean;
        currentHash: string;
        blockchainHash: string | null;
        originalHash: string;
        solanaTxId: string;
        explorerUrl: string;
        message: string;
      };
      error?: string;
    }>(`/contracts/${id}/verify`);
    return res.data;
  },
};

export default api;
