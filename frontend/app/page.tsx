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
  const [step, setStep] = useState(1); // 1: 정보입력, 2: 서명
  const [signature, setSignature] = useState<string | null>(null);

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
    hourlyWage: 9860,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      // 유효성 검사
      if (formData.workDays.length === 0) {
        alert('근무 요일을 선택해주세요.');
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: 서명 후 제출
    if (!signature) {
      alert('서명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 1. 계약서 생성
      const createRes = await contractApi.create(formData);
      const contractId = createRes.data.id;

      // 2. 고용주 서명
      await contractApi.employerSign(contractId, signature);

      // 3. 계약서 페이지로 이동
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
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-2">표준 근로계약서</h1>
        <p className="text-gray-600 text-center mb-8">전자 서명으로 간편하게 작성하세요</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {step === 1 ? (
            <>
              {/* 계약 유형 */}
              <div>
                <label className="block text-sm font-medium mb-2">계약 유형</label>
                <select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="REGULAR">정규직</option>
                  <option value="PARTTIME">파트타임</option>
                  <option value="DAILY">일용직</option>
                </select>
              </div>

              {/* 고용주 정보 */}
              <fieldset className="border rounded-lg p-4">
                <legend className="font-medium px-2">고용주 정보</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">상호명</label>
                    <input
                      type="text"
                      name="employerName"
                      value={formData.employerName}
                      onChange={handleChange}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">대표자명</label>
                    <input
                      type="text"
                      name="employerCeo"
                      value={formData.employerCeo}
                      onChange={handleChange}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">사업장 주소</label>
                    <input
                      type="text"
                      name="employerAddress"
                      value={formData.employerAddress}
                      onChange={handleChange}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">연락처</label>
                    <input
                      type="tel"
                      name="employerPhone"
                      value={formData.employerPhone}
                      onChange={handleChange}
                      required
                      placeholder="010-0000-0000"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </fieldset>

              {/* 근로자 정보 */}
              <fieldset className="border rounded-lg p-4">
                <legend className="font-medium px-2">근로자 정보</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">이름</label>
                    <input
                      type="text"
                      name="workerName"
                      value={formData.workerName}
                      onChange={handleChange}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">생년월일</label>
                    <input
                      type="text"
                      name="workerBirth"
                      value={formData.workerBirth}
                      onChange={handleChange}
                      required
                      placeholder="1990-01-01"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">주소</label>
                    <input
                      type="text"
                      name="workerAddress"
                      value={formData.workerAddress}
                      onChange={handleChange}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">연락처</label>
                    <input
                      type="tel"
                      name="workerPhone"
                      value={formData.workerPhone}
                      onChange={handleChange}
                      required
                      placeholder="010-0000-0000"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </fieldset>

              {/* 근무 조건 */}
              <fieldset className="border rounded-lg p-4">
                <legend className="font-medium px-2">근무 조건</legend>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">계약 시작일</label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">계약 종료일 (선택)</label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">근무 요일</label>
                    <div className="flex flex-wrap gap-2">
                      {WORK_DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleWorkDayToggle(day)}
                          className={`px-4 py-2 rounded border ${
                            formData.workDays.includes(day)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">근무 시작</label>
                      <input
                        type="time"
                        name="workStart"
                        value={formData.workStart}
                        onChange={handleChange}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">근무 종료</label>
                      <input
                        type="time"
                        name="workEnd"
                        value={formData.workEnd}
                        onChange={handleChange}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1">휴게시간 (분)</label>
                      <input
                        type="number"
                        name="breakTime"
                        value={formData.breakTime}
                        onChange={handleChange}
                        min="0"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">시급 (원)</label>
                      <input
                        type="number"
                        name="hourlyWage"
                        value={formData.hourlyWage}
                        onChange={handleChange}
                        min="0"
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">급여일</label>
                      <input
                        type="number"
                        name="payDay"
                        value={formData.payDay}
                        onChange={handleChange}
                        min="1"
                        max="31"
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* 특약 사항 */}
              <div>
                <label className="block text-sm font-medium mb-1">특약 사항 (선택)</label>
                <textarea
                  name="specialTerms"
                  value={formData.specialTerms}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  placeholder="추가 약정 사항을 입력하세요"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                다음: 고용주 서명
              </button>
            </>
          ) : (
            <>
              {/* Step 2: 서명 */}
              <div>
                <h2 className="text-lg font-medium mb-4">고용주 서명</h2>
                <p className="text-sm text-gray-600 mb-4">
                  아래 영역에 서명해주세요. 서명 후 계약서가 생성됩니다.
                </p>

                <SignaturePad
                  onSave={(sig) => setSignature(sig)}
                  onClear={() => setSignature(null)}
                />

                {signature && (
                  <p className="text-sm text-green-600 mt-2">서명이 저장되었습니다.</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={loading || !signature}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '처리 중...' : '계약서 생성'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
