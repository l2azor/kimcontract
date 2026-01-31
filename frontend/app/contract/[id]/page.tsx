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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다.');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('링크가 복사되었습니다.');
      } catch {
        alert('링크 복사에 실패했습니다. 수동으로 복사해주세요.');
      }
      document.body.removeChild(textArea);
    }
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-verification-cyan/30 border-t-verification-cyan rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-900 font-medium">계약서 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold text-lg mb-2">
            {error || '계약서를 찾을 수 없습니다.'}
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  const isWorkerSignNeeded = contract.status === 'SENT';
  const isCompleted = contract.status === 'COMPLETED';

  return (
    <main className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <a
              href="/"
              className="text-gray-700 hover:text-cyan-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 className="text-4xl font-bold text-gray-900">
              근로계약서
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="font-mono text-gray-600">
              ID: {contract.id.slice(0, 12)}...
            </span>
            <span
              className={`px-4 py-1.5 rounded-full font-bold ${
                isCompleted
                  ? 'bg-emerald-500 text-white border-2 border-emerald-400'
                  : 'bg-amber-500 text-white border-2 border-amber-400'
              }`}
            >
              {STATUS_LABEL[contract.status]}
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="glass-card p-8 lg:p-12 mb-8">
          {/* Contract Type Badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-100 to-emerald-100 border-2 border-cyan-400">
              <span className="text-2xl">
                {contract.contractType === 'REGULAR' ? '💼' : contract.contractType === 'PARTTIME' ? '⏰' : '📅'}
              </span>
              <span className="font-bold text-lg text-gray-800">
                {CONTRACT_TYPE_LABEL[contract.contractType]}
              </span>
            </div>
          </div>

          {/* Two-column layout for parties */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Employer */}
            <section className="relative">
              <div className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">
                A
              </div>
              <div className="pl-10">
                <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-wide">고용주</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-glass-border">
                    <span className="text-gray-800 font-bold">상호명</span>
                    <span className="text-gray-900 font-bold">{contract.employerName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-glass-border">
                    <span className="text-gray-800 font-bold">대표자</span>
                    <span className="text-gray-900 font-bold">{contract.employerCeo}</span>
                  </div>
                  <div className="py-2 border-b border-glass-border">
                    <span className="text-gray-800 font-bold block mb-1">주소</span>
                    <span className="text-gray-900 text-xs">{contract.employerAddress}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-800 font-bold">연락처</span>
                    <span className="text-gray-900 font-mono font-semibold">{contract.employerPhone}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Worker */}
            <section className="relative">
              <div className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                B
              </div>
              <div className="pl-10">
                <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-wide">근로자</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-glass-border">
                    <span className="text-gray-800 font-bold">이름</span>
                    <span className="text-gray-900 font-bold">{contract.workerName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-glass-border">
                    <span className="text-gray-800 font-bold">생년월일</span>
                    <span className="text-gray-900 font-mono font-semibold">{contract.workerBirth}</span>
                  </div>
                  <div className="py-2 border-b border-glass-border">
                    <span className="text-gray-800 font-bold block mb-1">주소</span>
                    <span className="text-gray-900 text-xs">{contract.workerAddress}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-800 font-bold">연락처</span>
                    <span className="text-gray-900 font-mono font-semibold">{contract.workerPhone}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Work Conditions */}
          <section className="mb-8 pt-8 border-t-2 border-glass-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
                C
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-wide">근무 조건</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-bold">계약 기간</div>
                <div className="text-gray-900 font-bold">
                  {new Date(contract.startDate).toLocaleDateString('ko-KR')}
                  <span className="mx-2 text-gray-500">~</span>
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString('ko-KR') : '무기한'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-bold">근무 요일</div>
                <div className="text-gray-900 font-bold">
                  {contract.workDays.join(', ')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-bold">근무 시간</div>
                <div className="text-gray-900 font-mono font-semibold">
                  {contract.workStart} - {contract.workEnd}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-bold">휴게시간</div>
                <div className="text-gray-900 font-bold">
                  {contract.breakTime}분
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-bold">시급</div>
                <div className="text-emerald-400 font-bold text-lg font-mono">
                  ₩{contract.hourlyWage.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-bold">급여일</div>
                <div className="text-gray-900 font-bold">
                  매월 {contract.payDay}일
                </div>
              </div>
            </div>
          </section>

          {/* Special Terms */}
          {contract.specialTerms && (
            <section className="mb-8 p-6 rounded-xl bg-gray-50 border-2 border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">특약 사항</h3>
              <p className="text-gray-900 leading-relaxed">{contract.specialTerms}</p>
            </section>
          )}

          {/* Signatures */}
          <section className="mb-8 pt-8 border-t-2 border-glass-border">
            <h2 className="text-lg font-bold text-gray-900 mb-6 tracking-wide text-center">전자 서명</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative p-6 rounded-2xl bg-gray-50 border-2 border-gray-200">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-cyan-100 rounded-full border-2 border-cyan-500">
                  <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">고용주</span>
                </div>
                {contract.employerSign ? (
                  <img
                    src={contract.employerSign}
                    alt="고용주 서명"
                    className="h-24 object-contain mx-auto filter drop-shadow-lg"
                  />
                ) : (
                  <div className="h-24 flex items-center justify-center text-gray-400">
                    서명 대기 중
                  </div>
                )}
              </div>
              <div className="relative p-6 rounded-2xl bg-gray-50 border-2 border-gray-200">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-100 rounded-full border-2 border-emerald-500">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">근로자</span>
                </div>
                {contract.workerSign ? (
                  <img
                    src={contract.workerSign}
                    alt="근로자 서명"
                    className="h-24 object-contain mx-auto filter drop-shadow-lg"
                  />
                ) : (
                  <div className="h-24 flex items-center justify-center text-gray-400">
                    서명 대기 중
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Blockchain Verification Section */}
          {isCompleted && contract.solanaTxId && (
            <section className="p-8 rounded-2xl bg-emerald-50 border-2 border-emerald-500">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-emerald-700">블록체인 검증</h2>
                    <p className="text-xs text-gray-600 font-semibold">Solana Mainnet</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-white border border-gray-200">
                    <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-bold">계약 해시 (SHA-256)</div>
                    <code className="text-xs text-gray-900 font-mono font-semibold break-all block">
                      {contract.pdfHash}
                    </code>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-gray-200">
                    <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-bold">트랜잭션 ID</div>
                    <a
                      href={`https://solscan.io/tx/${contract.solanaTxId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-700 transition-colors font-mono text-xs break-all underline"
                    >
                      {contract.solanaTxId}
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="crystal-btn w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blockchain-green/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                      검증 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      위변조 검증하기
                    </>
                  )}
                </button>

                {/* Verification Result */}
                {verifyResult && (
                  <div
                    className={`mt-6 p-6 rounded-xl border-2 ${
                      verifyResult.isValid
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-red-50 border-red-400'
                    }`}
                    style={{
                      animation: 'verifySuccess 0.6s ease-out'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`text-4xl ${verifyResult.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                        {verifyResult.isValid ? '✅' : '❌'}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-lg mb-3 ${verifyResult.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                          {verifyResult.isValid
                            ? '위변조되지 않은 원본 계약서입니다'
                            : '계약서가 위변조되었습니다!'}
                        </p>
                        <div className="space-y-3 text-xs">
                          <div className="p-3 rounded-lg bg-gray-100 border border-gray-300">
                            <div className={`mb-1 font-semibold ${verifyResult.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                              현재 해시:
                            </div>
                            <code className="text-gray-900 font-mono break-all block font-semibold">
                              {verifyResult.currentHash}
                            </code>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-100 border border-gray-300">
                            <div className={`mb-1 font-semibold ${verifyResult.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                              원본 해시:
                            </div>
                            <code className="text-gray-900 font-mono break-all block font-semibold">
                              {verifyResult.originalHash}
                            </code>
                          </div>
                        </div>
                        {!verifyResult.isValid && (
                          <div className="mt-4 p-3 rounded-lg bg-red-100 border-2 border-red-400">
                            <p className="text-red-700 font-bold text-sm">
                              ⚠️ 이 계약서의 내용이 서명 후 변경되었습니다!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Worker Signature Section */}
          {isWorkerSignNeeded && (
            <section className="mt-8 pt-8 border-t-2 border-glass-border">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">근로자 서명</h2>
                <p className="text-gray-700">
                  계약 내용을 확인하고 서명하시면 블록체인에 영구 기록됩니다
                </p>
              </div>
              <SignaturePad
                onSave={(sig) => setSignature(sig)}
                onClear={() => setSignature(null)}
              />
              <button
                onClick={handleWorkerSign}
                disabled={signing || !signature}
                className="crystal-btn w-full mt-6 bg-gradient-to-r from-amber-500 to-emerald-500 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-signature-gold/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                    블록체인 기록 중...
                  </span>
                ) : (
                  '서명 완료 및 블록체인 기록 🔐'
                )}
              </button>
            </section>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          {isCompleted && (
            <a
              href={contractApi.getPdfUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="crystal-btn flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-verification-cyan/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF 다운로드
            </a>
          )}
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl border-2 border-gray-300 bg-white text-gray-900 font-bold text-lg hover:bg-gray-50 hover:border-cyan-400 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            링크 복사
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p className="mb-2 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            블록체인 기반 위변조 방지 시스템
          </p>
          <p className="text-xs text-gray-400">
            Powered by Solana Mainnet • SHA-256 Hash
          </p>
        </div>
      </div>
    </main>
  );
}
