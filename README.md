# 복북정운대사 Admin

매장 관리자용 어드민 대시보드. 매장/방문 기록 관리, 통계 확인.

## 기술 스택

- React 19 (Vite)
- TypeScript
- Tailwind CSS v4
- React Query + Axios
- React Router v7

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev
```

http://localhost:3000 접속

## 프로젝트 구조

```
src/
├── api/                # API 클라이언트 (Axios)
├── components/
│   └── layout/         # AdminLayout, Sidebar, RequireAuth
├── pages/
│   ├── auth/           # 로그인
│   ├── dashboard/      # 대시보드 (통계)
│   ├── records/        # 방문 기록 관리
│   ├── settings/       # 설정
│   └── stores/         # 매장 관리
└── types/              # TypeScript 타입 정의
```

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `make init` | 최초 세팅 (env + install) |
| `make dev` | 개발 서버 실행 |
| `make build` | 프로덕션 빌드 |
| `make lint` | ESLint 실행 |
| `make help` | 전체 명령어 목록 |
