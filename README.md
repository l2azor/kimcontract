# KimContract - 전자 근로계약서 서비스

블록체인(Solana) 기반 전자 근로계약서 작성 및 서명 플랫폼

## 주요 기능

- 표준 근로계약서 작성 (정규직/파트타임/일용직)
- 고용주 및 근로자 전자 서명
- **Solana 메인넷** 블록체인에 계약 해시 기록
- 위변조 검증 시스템
- PDF 다운로드 (블록체인 검증 정보 포함)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, Prisma |
| Database | SQLite (개발), PostgreSQL (프로덕션 예정) |
| Blockchain | Solana Mainnet |
| PDF | pdf-lib (한글 폰트 지원) |

## 시작하기

### 사전 요구사항

- Node.js 20+
- npm 또는 yarn
- Solana 지갑 (Phantom 등)

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp backend/.env.example backend/.env
# SOLANA_PRIVATE_KEY 설정 필요

# DB 마이그레이션
cd backend && npx prisma migrate dev
```

### 실행

```bash
# 전체 실행 (백엔드 3000, 프론트엔드 3001)
npm run dev

# 개별 실행
npm run dev:backend
npm run dev:frontend
```

## 프로젝트 구조

```
kimcontract/
├── backend/                 # NestJS 백엔드
│   ├── src/
│   │   ├── contracts/       # 계약서 CRUD
│   │   ├── pdf/             # PDF 생성
│   │   ├── solana/          # 블록체인 연동
│   │   └── prisma/          # DB 서비스
│   └── prisma/              # 스키마 & 마이그레이션
├── frontend/                # Next.js 프론트엔드
│   ├── app/                 # 페이지
│   ├── components/          # 컴포넌트
│   └── lib/                 # API 클라이언트
└── docs/                    # 문서
```

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/contracts | 계약서 생성 |
| GET | /api/contracts/:id | 계약서 조회 |
| PATCH | /api/contracts/:id/employer-sign | 고용주 서명 |
| PATCH | /api/contracts/:id/worker-sign | 근로자 서명 + 블록체인 기록 |
| GET | /api/contracts/:id/pdf | PDF 다운로드 |
| GET | /api/contracts/:id/verify | 블록체인 검증 |

## 블록체인 검증

### 작동 방식

1. **계약 완료 시**: 계약 데이터를 SHA-256 해시로 변환
2. **Solana 기록**: `KIMCONTRACT:{hash}` 형식으로 메모 프로그램에 저장
3. **검증 시**: 현재 데이터 해시와 블록체인 기록 비교

### 트랜잭션 확인

블록체인에 기록된 트랜잭션은 Solscan에서 확인 가능:
```
https://solscan.io/tx/{solanaTxId}
```

### 검증 결과

- **일치**: 계약서가 위변조되지 않음
- **불일치**: 서명 후 데이터가 변경됨

## 환경 변수

```env
# backend/.env
DATABASE_URL="file:./dev.db"
SOLANA_PRIVATE_KEY="your_base58_private_key"
```

## 라이선스

MIT License

## 변경 이력

### v1.0.0 (2026.01.24)
- Solana 메인넷 전환
- 블록체인 검증 버그 수정 (base58 디코딩)
- Solscan 탐색기 링크 적용
- PDF에 검증 URL 추가
