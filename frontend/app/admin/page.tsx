'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, DashboardStats } from '@/lib/api';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getStats();
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
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">전자 근로계약서 현황을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="전체 계약서"
            value={stats.overview.total}
            color="border-gray-500"
          />
          <StatsCard
            title="작성 중"
            value={stats.overview.draft}
            color="border-gray-400"
          />
          <StatsCard
            title="서명 대기"
            value={stats.overview.sent}
            color="border-yellow-500"
          />
          <StatsCard
            title="서명 완료"
            value={stats.overview.signed}
            color="border-blue-500"
          />
          <StatsCard
            title="완료"
            value={stats.overview.completed}
            color="border-green-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 최근 계약서 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">최근 계약서</h2>
              <Link
                href="/admin/contracts"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                전체 보기
              </Link>
            </div>
          </div>
          <div className="p-6">
            {stats?.recentContracts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">계약서가 없습니다</p>
            ) : (
              <ul className="space-y-4">
                {stats?.recentContracts.map((contract) => (
                  <li
                    key={contract.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {contract.workerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(contract.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {getStatusLabel(contract.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 월별 통계 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">월별 계약 현황</h2>
          </div>
          <div className="p-6">
            {stats?.monthlyStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">데이터가 없습니다</p>
            ) : (
              <div className="space-y-4">
                {stats?.monthlyStats.map((month) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-gray-600">{month.month}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (month.created / Math.max(1, stats.overview.total / 6)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">
                        {month.created}건
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="flex gap-4">
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            새 계약서 작성
          </Link>
          <Link
            href="/admin/contracts"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            계약서 관리
          </Link>
        </div>
      </div>
    </div>
  );
}
