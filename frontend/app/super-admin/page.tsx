'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { superAdminApi, SuperAdminStats } from '@/lib/api';

function StatsCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function getStatusLabel(status: string) {
  const labels: { [key: string]: string } = {
    DRAFT: '작성 중',
    SENT: '서명 대기',
    SIGNED: '서명 완료',
    COMPLETED: '완료',
  };
  return labels[status] || status;
}

function getStatusColor(status: string) {
  const colors: { [key: string]: string } = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-yellow-100 text-yellow-800',
    SIGNED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await superAdminApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch {
      setError('통계를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">슈퍼 관리자 대시보드</h1>
        <p className="text-gray-600">전체 시스템 현황을 확인하세요</p>
      </div>

      {stats && (
        <>
          {/* 회사 통계 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">회사 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title="전체 회사"
                value={stats.companies.total}
                color="border-purple-500"
              />
              <StatsCard
                title="활성 회사"
                value={stats.companies.active}
                color="border-green-500"
              />
              <StatsCard
                title="전체 사용자"
                value={stats.users.total}
                color="border-blue-500"
              />
            </div>
          </div>

          {/* 계약서 통계 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">계약서 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatsCard
                title="전체 계약서"
                value={stats.contracts.total}
                color="border-gray-500"
              />
              <StatsCard
                title="작성 중"
                value={stats.contracts.draft}
                color="border-gray-400"
              />
              <StatsCard
                title="서명 대기"
                value={stats.contracts.sent}
                color="border-yellow-500"
              />
              <StatsCard
                title="서명 완료"
                value={stats.contracts.signed}
                color="border-blue-500"
              />
              <StatsCard
                title="완료"
                value={stats.contracts.completed}
                color="border-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 최근 가입 회사 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">최근 가입 회사</h2>
                  <Link
                    href="/super-admin/companies"
                    className="text-sm text-purple-600 hover:text-purple-500"
                  >
                    전체 보기
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {stats.recentCompanies.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">등록된 회사가 없습니다</p>
                ) : (
                  <ul className="space-y-4">
                    {stats.recentCompanies.map((company) => (
                      <li key={company.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{company.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(company.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 최근 계약서 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">최근 계약서</h2>
                  <Link
                    href="/super-admin/contracts"
                    className="text-sm text-purple-600 hover:text-purple-500"
                  >
                    전체 보기
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {stats.recentContracts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">계약서가 없습니다</p>
                ) : (
                  <ul className="space-y-4">
                    {stats.recentContracts.map((contract) => (
                      <li key={contract.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{contract.workerName}</p>
                          <p className="text-sm text-gray-500">{contract.companyName}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}
                        >
                          {getStatusLabel(contract.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
