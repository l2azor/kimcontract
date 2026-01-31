'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { contractApi, CreateContractDto } from '@/lib/api';
import dynamic from 'next/dynamic';

const SignaturePad = dynamic(() => import('@/components/SignaturePad'), {
  ssr: false,
});

const WORK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [signature, setSignature] = useState<string | null>(null);
  const [isIndefinite, setIsIndefinite] = useState(false);

  const [formData, setFormData] = useState<CreateContractDto>({
    contractType: 'PARTTIME',
    employerName: '',
    employerCeo: '',
    employerAddress: '',
    employerPhone: '',
    workerName: '',
    workerBirth: '',
    workerPhone: '',
    workerAddress: '',
    startDate: '',
    endDate: '',
    workDays: [],
    workStart: '09:00',
    workEnd: '18:00',
    breakTime: 60,
    hourlyWage: 10320,
    payDay: 10,
    specialTerms: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleWorkDayToggle = (day: string) => {
    const newDays = formData.workDays.includes(day)
      ? formData.workDays.filter((d) => d !== day)
      : [...formData.workDays, day];
    setFormData({ ...formData, workDays: newDays });
  };

  const handleIndefiniteToggle = () => {
    setIsIndefinite(!isIndefinite);
    if (!isIndefinite) {
      setFormData({ ...formData, endDate: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (formData.workDays.length === 0) {
        alert('근무 요일을 선택해주세요.');
        return;
      }
      setStep(2);
      return;
    }

    if (!signature) {
      alert('서명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // endDate가 빈 문자열이면 제거 (무기계약)
      const contractData = { ...formData };
      if (!contractData.endDate || contractData.endDate === '') {
        delete contractData.endDate;
      }

      const createRes = await contractApi.create(contractData);
      const contractId = createRes.data.id;
      await contractApi.employerSign(contractId, signature);
      alert('계약서가 생성되었습니다. 근로자에게 링크를 공유해주세요.');
      router.push(`/contract/${contractId}`);
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            계약왕김계약
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            블록체인으로 영원히 보존되는 디지털 근로계약
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium">Solana Mainnet</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">SHA-256 Verified</span>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`step-indicator ${step === 1 ? 'active' : 'completed'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className={`text-sm font-bold text-gray-900`}>
              계약 정보
            </span>
          </div>
          <div className={`w-24 h-0.5 transition-all duration-500 ${step > 1 ? 'bg-emerald-400' : 'bg-gray-400'}`} />
          <div className="flex items-center gap-3">
            <div className={`step-indicator ${step === 2 ? 'active' : 'bg-gray-400 text-white'}`}>
              2
            </div>
            <span className={`text-sm font-bold ${step === 2 ? 'text-gray-900' : 'text-gray-600'}`}>
              전자 서명
            </span>
          </div>
        </div>

        {/* Main Form Card */}
        <form onSubmit={handleSubmit} className="glass-card p-8 lg:p-12">
          {step === 1 ? (
            <div className="space-y-8">
              {/* Contract Type */}
              <div className="pb-8 border-b border-glass-border">
                <label className="block text-sm font-bold mb-4 text-gray-900 uppercase tracking-widest">
                  계약 유형
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'REGULAR', label: '정규직', icon: '💼' },
                    { value: 'PARTTIME', label: '파트타임', icon: '⏰' },
                    { value: 'DAILY', label: '일용직', icon: '📅' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, contractType: type.value })}
                      className={`crystal-btn p-6 rounded-2xl border-2 transition-all duration-300 ${
                        formData.contractType === type.value
                          ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-400/20'
                          : 'border-gray-300 hover:border-cyan-400 bg-white'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className={`font-bold ${formData.contractType === type.value ? 'text-cyan-500' : 'text-gray-800'}`}>
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Employer Info */}
              <fieldset className="space-y-6">
                <legend className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                    A
                  </div>
                  고용주 정보
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      상호명
                    </label>
                    <input
                      type="text"
                      name="employerName"
                      value={formData.employerName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-verification-cyan focus:border-transparent transition-all"
                      placeholder="(주)테크노벨"
                    />
                  </div>
                  <div className="input-group">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      대표자명
                    </label>
                    <input
                      type="text"
                      name="employerCeo"
                      value={formData.employerCeo}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-verification-cyan focus:border-transparent transition-all"
                      placeholder="김대표"
                    />
                  </div>
                  <div className="input-group md:col-span-2">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      사업장 주소
                    </label>
                    <input
                      type="text"
                      name="employerAddress"
                      value={formData.employerAddress}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-verification-cyan focus:border-transparent transition-all"
                      placeholder="서울특별시 강남구 테헤란로 123"
                    />
                  </div>
                  <div className="input-group md:col-span-2">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      연락처
                    </label>
                    <input
                      type="tel"
                      name="employerPhone"
                      value={formData.employerPhone}
                      onChange={handleChange}
                      required
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium font-mono focus:outline-none focus:ring-2 focus:ring-verification-cyan focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Worker Info */}
              <fieldset className="space-y-6">
                <legend className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                    B
                  </div>
                  근로자 정보
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      이름
                    </label>
                    <input
                      type="text"
                      name="workerName"
                      value={formData.workerName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blockchain-green focus:border-transparent transition-all"
                      placeholder="홍길동"
                    />
                  </div>
                  <div className="input-group">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      생년월일
                    </label>
                    <input
                      type="text"
                      name="workerBirth"
                      value={formData.workerBirth}
                      onChange={handleChange}
                      required
                      placeholder="1990-01-01"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium font-mono focus:outline-none focus:ring-2 focus:ring-blockchain-green focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="input-group md:col-span-2">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      주소
                    </label>
                    <input
                      type="text"
                      name="workerAddress"
                      value={formData.workerAddress}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blockchain-green focus:border-transparent transition-all"
                      placeholder="서울특별시 마포구 월드컵로 123"
                    />
                  </div>
                  <div className="input-group md:col-span-2">
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                      연락처
                    </label>
                    <input
                      type="tel"
                      name="workerPhone"
                      value={formData.workerPhone}
                      onChange={handleChange}
                      required
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium font-mono focus:outline-none focus:ring-2 focus:ring-blockchain-green focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Work Conditions */}
              <fieldset className="space-y-6">
                <legend className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                    C
                  </div>
                  근무 조건
                </legend>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="input-group">
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                        계약 시작일
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-signature-gold focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="input-group">
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                        계약 종료일
                      </label>

                      {/* 무기계약 체크박스 */}
                      <div className="mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isIndefinite}
                            onChange={handleIndefiniteToggle}
                            className="w-5 h-5 rounded border-2 border-gray-300 text-cyan-500 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            정함없음 (정규직, 무기계약)
                          </span>
                        </label>
                      </div>

                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        disabled={isIndefinite}
                        className={`w-full px-4 py-3 rounded-xl border-2 font-medium focus:outline-none focus:ring-2 focus:ring-signature-gold focus:border-transparent transition-all ${
                          isIndefinite
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="block text-xs font-semibold mb-3 text-gray-700 uppercase tracking-wider font-bold">
                      근무 요일
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {WORK_DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleWorkDayToggle(day)}
                          className={`crystal-btn px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                            formData.workDays.includes(day)
                              ? 'bg-amber-400 text-gray-900 border-2 border-amber-500 shadow-lg shadow-amber-400/30'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-amber-400'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="input-group">
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                        근무 시작
                      </label>
                      <input
                        type="time"
                        name="workStart"
                        value={formData.workStart}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium font-mono focus:outline-none focus:ring-2 focus:ring-signature-gold focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="input-group">
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                        근무 종료
                      </label>
                      <input
                        type="time"
                        name="workEnd"
                        value={formData.workEnd}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium font-mono focus:outline-none focus:ring-2 focus:ring-signature-gold focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="input-group">
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                        휴게시간 (분)
                      </label>
                      <input
                        type="number"
                        name="breakTime"
                        value={formData.breakTime}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-signature-gold focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="input-group">
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                        시급 (원)
                      </label>
                      <input
                        type="number"
                        name="hourlyWage"
                        value={formData.hourlyWage}
                        onChange={handleChange}
                        min="0"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-signature-gold focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="input-group">
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider font-bold">
                        급여일
                      </label>
                      <input
                        type="number"
                        name="payDay"
                        value={formData.payDay}
                        onChange={handleChange}
                        min="1"
                        max="31"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-signature-gold focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Special Terms */}
              <div className="input-group">
                <label className="block text-xs font-bold mb-2 text-gray-900 uppercase tracking-wider">
                  특약 사항 (선택)
                </label>
                <textarea
                  name="specialTerms"
                  value={formData.specialTerms}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-verification-cyan focus:border-transparent transition-all resize-none"
                  placeholder="추가 약정 사항을 입력하세요"
                />
              </div>

              <button
                type="submit"
                className="crystal-btn w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-verification-cyan/30 transition-all duration-300 hover:scale-[1.02]"
              >
                다음: 고용주 서명 →
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">고용주 전자 서명</h2>
                <p className="text-gray-700">
                  아래 영역에 서명하시면 블록체인에 영구 기록됩니다
                </p>
              </div>

              <SignaturePad
                onSave={(sig) => setSignature(sig)}
                onClear={() => setSignature(null)}
              />

              {signature && (
                <div className="p-4 rounded-xl bg-emerald-100 border-2 border-emerald-400 text-center">
                  <p className="text-emerald-700 font-bold flex items-center justify-center gap-2">
                    <span className="text-xl">✓</span>
                    서명이 저장되었습니다
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-300 py-4 rounded-2xl font-bold text-gray-900 bg-white hover:bg-gray-50 transition-all"
                >
                  ← 이전
                </button>
                <button
                  type="submit"
                  disabled={loading || !signature}
                  className="crystal-btn flex-1 bg-gradient-to-r from-amber-500 to-emerald-500 text-white py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-signature-gold/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                      블록체인 기록 중...
                    </span>
                  ) : (
                    '계약서 생성 🔐'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p className="mb-2">
            🔒 모든 데이터는 Solana 블록체인에 암호화되어 저장됩니다
          </p>
          <p className="text-xs text-gray-400">
            Powered by SHA-256 • Solana Mainnet
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .input-group input,
        .input-group textarea,
        .input-group select {
          transition: all 0.3s ease;
        }

        .input-group input:focus,
        .input-group textarea:focus,
        .input-group select:focus {
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
