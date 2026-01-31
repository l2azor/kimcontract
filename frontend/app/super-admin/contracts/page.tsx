'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { superAdminApi, ContractWithCompany, Pagination, AllContractsQuery } from '@/lib/api';

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

function getContractTypeLabel(type: string) {
  const labels: { [key: string]: string } = {
    REGULAR: '정규직',
    PARTTIME: '단시간',
    DAILY: '일용직',
  };
  return labels[type] || type;
}

export default function AllContractsPage() {
  const [contracts, setContracts] = useState<ContractWithCompany[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState<AllContractsQuery>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    contractType: '',
  });

  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await superAdminApi.getAllContracts(query);
      if (response.success) {
        setContracts(response.data.contracts);
        setPagination(response.data.pagination);
      }
    } catch {
      setError('계약서 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery({ ...query, page: 1 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">전체 계약서</h1>
        <p className="text-gray-600">모든 회사의 계약서를 확인하세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="근로자 이름, 전화번호, 회사명 검색"
            className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={query.search}
            onChange={(e) => setQuery({ ...query, search: e.target.value })}
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={query.status}
            onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
          >
            <option value="">모든 상태</option>
            <option value="DRAFT">작성 중</option>
            <option value="SENT">서명 대기</option>
            <option value="SIGNED">서명 완료</option>
            <option value="COMPLETED">완료</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={query.contractType}
            onChange={(e) => setQuery({ ...query, contractType: e.target.value, page: 1 })}
          >
            <option value="">모든 유형</option>
            <option value="REGULAR">정규직</option>
            <option value="PARTTIME">단시간</option>
            <option value="DAILY">일용직</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            검색
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 계약서 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">계약서가 없습니다</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  근로자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약 기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contract.company?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{contract.workerName}</div>
                    <div className="text-sm text-gray-500">{contract.workerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getContractTypeLabel(contract.contractType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contract.startDate).toLocaleDateString('ko-KR')}
                    {contract.endDate && (
                      <> ~ {new Date(contract.endDate).toLocaleDateString('ko-KR')}</>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.hourlyWage.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}
                    >
                      {getStatusLabel(contract.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contract.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/contract/${contract.id}`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        보기
                      </Link>
                      {contract.solanaTxId && (
                        <a
                          href={`https://solscan.io/tx/${contract.solanaTxId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          검증
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}개
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setQuery({ ...query, page: (query.page || 1) - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={() => setQuery({ ...query, page: (query.page || 1) + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
