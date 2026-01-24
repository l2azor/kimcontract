# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

전자 근로계약서 서비스 (kimcontract) - 블록체인(Solana) 기반 계약서 작성 및 서명 플랫폼

## Build and Development Commands

```bash
# 전체 개발 서버 실행 (백엔드: 3000, 프론트엔드: 3001)
npm run dev

# 개별 실행
npm run dev:backend    # 백엔드만 실행
npm run dev:frontend   # 프론트엔드만 실행

# 빌드
npm run build          # 전체 빌드
npm run build:backend
npm run build:frontend

# DB 마이그레이션
cd backend && npx prisma migrate dev

# Prisma Studio (DB 확인)
cd backend && npx prisma studio
```

## Architecture

```
kimcontract/
├── backend/           # NestJS 백엔드
│   ├── src/
│   │   ├── contracts/ # 계약서 모듈 (Controller, Service, DTO)
│   │   ├── pdf/       # PDF 생성 서비스
│   │   ├── solana/    # Solana 블록체인 연동
│   │   └── prisma/    # Prisma 서비스
│   └── prisma/        # DB 스키마 및 마이그레이션
├── frontend/          # Next.js 프론트엔드
│   ├── app/           # App Router 페이지
│   ├── components/    # React 컴포넌트
│   └── lib/           # API 클라이언트
└── docs/              # 문서
```

## Database Schema (Prisma)

```prisma
model Contract {
  id              String    @id @default(uuid())
  status          String    @default("DRAFT")  // DRAFT, SENT, SIGNED, COMPLETED
  contractType    String    // REGULAR, PARTTIME, DAILY

  // 고용주 정보
  employerName    String
  employerCeo     String
  employerAddress String
  employerPhone   String

  // 근로자 정보
  workerName      String
  workerBirth     String
  workerPhone     String
  workerAddress   String

  // 근무 조건
  startDate       DateTime
  endDate         DateTime?
  workDays        String    // JSON ["월","화","수"]
  workStart       String
  workEnd         String
  breakTime       Int
  hourlyWage      Int
  payDay          Int

  // 서명 (Base64)
  employerSign    String?
  workerSign      String?

  // 블록체인
  pdfHash         String?
  solanaTxId      String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  signedAt        DateTime?
}
```

## API 엔드포인트

모든 API는 `/api` 접두사를 사용합니다.

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/contracts | 계약서 생성 |
| GET | /api/contracts/:id | 계약서 조회 |
| PATCH | /api/contracts/:id/employer-sign | 고용주 서명 |
| PATCH | /api/contracts/:id/worker-sign | 근로자 서명 + 블록체인 기록 |
| GET | /api/contracts/:id/pdf | PDF 다운로드 |
| GET | /api/contracts/:id/verify | 블록체인 검증 |

## 코딩 컨벤션
- 컴포넌트: PascalCase (ContractForm.tsx)
- 함수/변수: camelCase
- API 응답: { success: boolean, data?: T, error?: string }
- 에러 처리: NestJS Exception Filter 사용
- 한글 주석 사용 OK

## 참고 문서
- 상세 요구사항: /docs/PRD.md
- 표준근로계약서 양식: 고용노동부 기준

## 주의사항
- MVP에서는 본인인증 없이 진행 (Phase 2에서 PASS/카카오 연동)
- **솔라나 메인넷 사용 중** (2026.01.24 전환 완료)
- 개인정보는 암호화 저장 (AES-256) - 현재 미구현
- SQLite 사용 중 (프로덕션에서 PostgreSQL로 전환 필요)

## 블록체인 검증 시스템

### 해시 생성 방식
계약 데이터를 JSON으로 직렬화한 후 SHA-256 해시 생성:
```typescript
const hashData = {
  contractType, employerName, employerCeo, employerAddress, employerPhone,
  workerName, workerBirth, workerPhone, workerAddress,
  startDate, endDate, workDays, workStart, workEnd, breakTime, hourlyWage, payDay,
  specialTerms, employerSign, workerSign, signedAt
};
const hash = crypto.createHash('sha256').update(JSON.stringify(hashData)).digest('hex');
```

### Solana 메모 저장 형식
```
KIMCONTRACT:{sha256_hash}
```

### 트랜잭션 검증
- 블록체인 탐색기: **Solscan** (https://solscan.io)
- 메모 데이터는 base58로 인코딩되어 저장됨
- 검증 시 base58 디코딩 → UTF-8 변환 → 해시 추출

## 최근 변경사항 (2026.01.24)

### 버그 수정
- **블록체인 검증 오류 수정**: Solana RPC에서 반환하는 메모 데이터가 base58 형식임을 확인하고 디코딩 로직 수정
  - 파일: `backend/src/solana/solana.service.ts`
  - 변경: base64 디코딩 → base58 디코딩 우선 시도

### 기능 개선
- **Solscan 링크 적용**: 모든 Solana Explorer 링크를 Solscan으로 변경
  - 프론트엔드 계약서 페이지
  - PDF 하단 검증 정보
  - API 응답의 explorerUrl
- **PDF 검증 URL 추가**: PDF 하단에 Solscan 검증 URL 표시
- **계약 해시 전체 표시**: 계약서 페이지에서 해시 전체 문자열 표시 (truncation 제거)
