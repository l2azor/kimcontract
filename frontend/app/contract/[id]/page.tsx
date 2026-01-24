'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { contractApi, Contract } from '@/lib/api';
import dynamic from 'next/dynamic';

const SignaturePad = dynamic(() => import('@/components/SignaturePad'), {
  ssr: false,
});

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  REGULAR: '정규직',
  PARTTIME: '파트타임',
  DAILY: '일용직',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  SENT: '서명 대기',
  SIGNED: '서명 완료',
  COMPLETED: '계약 체결',
};

export default function ContractPage() {
  const params = useParams();
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    isValid: boolean;
    currentHash: string;
    blockchainHash: string | null;
    originalHash: string;
    message: string;
  } | null>(null);

  const loadContract = useCallback(async () => {
    try {
      const res = await contractApi.get(id);
      setContract(res.data);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || '계약서를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const handleWorkerSign = async () => {
    if (!signature) {
      alert('서명을 입력해주세요.');
      return;
    }

    setSigning(true);
    try {
      const res = await contractApi.workerSign(id, signature);
      setContract(res.data);
      alert('서명이 완료되었습니다!');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || '서명에 실패했습니다.');
    } finally {
      setSigning(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다.');
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await contractApi.verify(id);
      if (res.success && res.data) {
        setVerifyResult({
          isValid: res.data.isValid,
          currentHash: res.data.currentHash,
          blockchainHash: res.data.blockchainHash,
          originalHash: res.data.originalHash,
          message: res.data.message,
        });
      } else {
        alert(res.error || '검증에 실패했습니다.');
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || '검증에 실패했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error || '계약서를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  const isWorkerSignNeeded = contract.status === 'SENT';
  const isCompleted = contract.status === 'COMPLETED';

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold">표준 근로계약서</h1>
              <p className="text-sm text-gray-500 mt-1">
                계약 ID: {contract.id.slice(0, 8)}...
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                isCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {STATUS_LABEL[contract.status]}
            </span>
          </div>

          {/* 계약 유형 */}
          <div className="mb-6">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
              {CONTRACT_TYPE_LABEL[contract.contractType]}
            </span>
          </div>

          {/* 고용주 정보 */}
          <section className="mb-6">
            <h2 className="font-medium text-gray-700 border-b pb-2 mb-3">고용주</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">상호명:</span> {contract.employerName}
              </div>
              <div>
                <span className="text-gray-500">대표자:</span> {contract.employerCeo}
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">주소:</span> {contract.employerAddress}
              </div>
              <div>
                <span className="text-gray-500">연락처:</span> {contract.employerPhone}
              </div>
            </div>
          </section>

          {/* 근로자 정보 */}
          <section className="mb-6">
            <h2 className="font-medium text-gray-700 border-b pb-2 mb-3">근로자</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">이름:</span> {contract.workerName}
              </div>
              <div>
                <span className="text-gray-500">생년월일:</span> {contract.workerBirth}
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">주소:</span> {contract.workerAddress}
              </div>
              <div>
                <span className="text-gray-500">연락처:</span> {contract.workerPhone}
              </div>
            </div>
          </section>

          {/* 근무 조건 */}
          <section className="mb-6">
            <h2 className="font-medium text-gray-700 border-b pb-2 mb-3">근무 조건</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">계약 기간:</span>{' '}
                {new Date(contract.startDate).toLocaleDateString('ko-KR')} ~{' '}
                {contract.endDate
                  ? new Date(contract.endDate).toLocaleDateString('ko-KR')
                  : '무기한'}
              </div>
              <div>
                <span className="text-gray-500">근무 요일:</span>{' '}
                {contract.workDays.join(', ')}
              </div>
              <div>
                <span className="text-gray-500">근무 시간:</span> {contract.workStart} ~{' '}
                {contract.workEnd}
              </div>
              <div>
                <span className="text-gray-500">휴게 시간:</span> {contract.breakTime}분
              </div>
              <div>
                <span className="text-gray-500">시급:</span>{' '}
                {contract.hourlyWage.toLocaleString()}원
              </div>
              <div>
                <span className="text-gray-500">급여일:</span> 매월 {contract.payDay}일
              </div>
            </div>
          </section>

          {/* 특약 사항 */}
          {contract.specialTerms && (
            <section className="mb-6">
              <h2 className="font-medium text-gray-700 border-b pb-2 mb-3">특약 사항</h2>
              <p className="text-sm">{contract.specialTerms}</p>
            </section>
          )}

          {/* 서명 현황 */}
          <section className="mb-6">
            <h2 className="font-medium text-gray-700 border-b pb-2 mb-3">서명</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <p className="text-sm text-gray-500 mb-2">고용주 서명</p>
                {contract.employerSign ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={contract.employerSign}
                    alt="고용주 서명"
                    className="h-16 object-contain"
                  />
                ) : (
                  <p className="text-gray-400 text-sm">서명 없음</p>
                )}
              </div>
              <div className="border rounded p-3">
                <p className="text-sm text-gray-500 mb-2">근로자 서명</p>
                {contract.workerSign ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={contract.workerSign}
                    alt="근로자 서명"
                    className="h-16 object-contain"
                  />
                ) : (
                  <p className="text-gray-400 text-sm">서명 없음</p>
                )}
              </div>
            </div>
          </section>

          {/* 블록체인 정보 */}
          {isCompleted && contract.solanaTxId && (
            <section className="mb-6 bg-gray-50 rounded-lg p-4">
              <h2 className="font-medium text-gray-700 mb-3">블록체인 검증 정보</h2>
              <div className="text-sm space-y-2">
                <p>
                  <span className="text-gray-500">계약 해시:</span>{' '}
                  <code className="text-xs bg-gray-200 px-1 rounded break-all">
                    {contract.pdfHash}
                  </code>
                </p>
                <p>
                  <span className="text-gray-500">Solana TX:</span>{' '}
                  <a
                    href={`https://solscan.io/tx/${contract.solanaTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {contract.solanaTxId.slice(0, 20)}...
                  </a>
                </p>
              </div>

              {/* 검증 버튼 */}
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="mt-3 w-full bg-purple-600 text-white py-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {verifying ? '검증 중...' : '🔍 위변조 검증하기'}
              </button>

              {/* 검증 결과 */}
              {verifyResult && (
                <div
                  className={`mt-3 p-3 rounded-lg ${
                    verifyResult.isValid
                      ? 'bg-green-100 border border-green-300'
                      : 'bg-red-100 border border-red-300'
                  }`}
                >
                  <p
                    className={`font-medium ${
                      verifyResult.isValid ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {verifyResult.isValid
                      ? '✅ 위변조되지 않은 원본 계약서입니다.'
                      : '❌ 계약서가 위변조되었습니다!'}
                  </p>
                  <div className="mt-2 text-xs space-y-1">
                    <p className={verifyResult.isValid ? 'text-green-700' : 'text-red-700'}>
                      현재 해시:
                    </p>
                    <code className={`block break-all text-xs p-1 rounded ${verifyResult.isValid ? 'bg-green-200' : 'bg-red-200'}`}>
                      {verifyResult.currentHash}
                    </code>
                    <p className={`mt-2 ${verifyResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                      원본 해시:
                    </p>
                    <code className={`block break-all text-xs p-1 rounded ${verifyResult.isValid ? 'bg-green-200' : 'bg-red-200'}`}>
                      {verifyResult.originalHash}
                    </code>
                    {!verifyResult.isValid && (
                      <p className="text-red-800 font-medium mt-2">
                        ⚠️ 이 계약서의 내용이 서명 후 변경되었습니다!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 근로자 서명 영역 */}
          {isWorkerSignNeeded && (
            <section className="border-t pt-6">
              <h2 className="font-medium mb-4">근로자 서명</h2>
              <p className="text-sm text-gray-600 mb-4">
                계약 내용을 확인하고 아래에 서명해주세요.
              </p>
              <SignaturePad
                onSave={(sig) => setSignature(sig)}
                onClear={() => setSignature(null)}
              />
              {signature && (
                <p className="text-sm text-green-600 mt-2">서명이 저장되었습니다.</p>
              )}
              <button
                onClick={handleWorkerSign}
                disabled={signing || !signature}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {signing ? '처리 중...' : '서명 완료'}
              </button>
            </section>
          )}

          {/* 액션 버튼 */}
          <div className="mt-6 space-y-3">
            {isCompleted && (
              <a
                href={contractApi.getPdfUrl(id)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                PDF 다운로드
              </a>
            )}
            <button
              onClick={copyLink}
              className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              링크 복사
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
