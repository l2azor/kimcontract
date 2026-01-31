import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

// 토큰 자동 첨부 인터셉터
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 로그인 페이지가 아닌 경우에만 리다이렉트
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

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

// 인증 API
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthCompany {
  id: string;
  name: string;
  ceoName: string;
  businessNumber: string;
  address: string;
  phone: string;
}

export interface AuthResponse {
  user: AuthUser;
  company: AuthCompany;
  token: string;
}

export interface SignupData {
  email: string;
  password: string;
  companyName: string;
  ceoName: string;
  businessNumber: string;
  address: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  signup: async (data: SignupData) => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/signup', data);
    return res.data;
  },

  login: async (data: LoginData) => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data);
    return res.data;
  },

  me: async () => {
    const res = await api.get<{ success: boolean; data: { id: string; email: string; role: string; company: AuthCompany } }>('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

// 관리자 API
export interface ContractListItem {
  id: string;
  status: string;
  contractType: string;
  employerName: string;
  workerName: string;
  workerPhone: string;
  startDate: string;
  endDate?: string;
  hourlyWage: number;
  createdAt: string;
  signedAt?: string;
  solanaTxId?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ContractQuery {
  search?: string;
  status?: string;
  contractType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StatsOverview {
  total: number;
  draft: number;
  sent: number;
  signed: number;
  completed: number;
}

export interface MonthlyStats {
  month: string;
  created: number;
  completed: number;
}

export interface DashboardStats {
  overview: StatsOverview;
  recentContracts: { id: string; workerName: string; status: string; createdAt: string }[];
  monthlyStats: MonthlyStats[];
}

export const adminApi = {
  getContracts: async (query: ContractQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const res = await api.get<{ success: boolean; data: { contracts: ContractListItem[]; pagination: Pagination } }>(`/admin/contracts?${params.toString()}`);
    return res.data;
  },

  getContractDetail: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Contract }>(`/admin/contracts/${id}`);
    return res.data;
  },

  updateContractStatus: async (id: string, status: string) => {
    const res = await api.patch<{ success: boolean; data: Contract }>(`/admin/contracts/${id}/status`, { status });
    return res.data;
  },

  deleteContract: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/admin/contracts/${id}`);
    return res.data;
  },

  getStats: async () => {
    const res = await api.get<{ success: boolean; data: DashboardStats }>('/admin/stats');
    return res.data;
  },
};

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
