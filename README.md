# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

사내 회의실 예약/관리 시스템의 **프론트엔드**. NestJS 백엔드(`BACKEND.md`가 단일 소스 오브 트루스)에 대한 관리자형 CRUD UI를 Next.js App Router로 구현한다. 이 저장소에는 백엔드 코드가 없다 — `BACKEND.md`가 전체 API 명세이며, 프론트엔드를 수정할 때 반드시 이 파일과 대조한다.

## Commands

```bash
pnpm dev      # 개발 서버 (Turbopack)
pnpm build    # 프로덕션 빌드 — 타입/페이지 검증에 사용
pnpm start    # 빌드 결과 실행
pnpm lint     # eslint
```

- 테스트 스위트 없음. 변경 검증은 `pnpm build`로 한다 (`next.config.mjs`가 `ignoreBuildErrors: true`이므로 타입 오류는 **빌드를 막지 않는다** — 타입 검증은 별도로 `npx tsc --noEmit` 실행).
- 패키지 매니저는 **pnpm** (`pnpm-lock.yaml`).

## Architecture

### 백엔드 연동 (핵심)
- 모든 API 호출은 `BASE_URL = "/api/proxy"`를 거친다. `next.config.mjs`의 rewrite가 `/api/proxy/:path*` → `${BACKEND_URL}/:path*`로 프록시한다. `BACKEND_URL`은 `.env.local`에 설정. 호출 경로는 `/api/proxy` 접두사를 제외하면 `BACKEND.md`의 경로와 1:1로 대응한다.
- 백엔드 응답은 **래퍼/페이지네이션 없음** — 엔티티가 JSON 그대로 반환되고, 목록 API는 전체 레코드를 반환한다.
- **데이터 패칭은 SWR**. 컴포넌트에서 `useSWR<T>("/<path>", fetcher)`로 직접 백엔드 경로를 키로 사용하고, 변경(mutation) 후 `mutate()`로 갱신한다. 별도의 store/context 없음.

### lib/ 레이어
- **lib/api.ts** — 단일 `api<T>()` 래퍼 + 도메인별 클라이언트 객체(`userApi`, `reservationApi`, `meetingRoomApi`, `equipmentApi`, `adminApi`, `usageLogApi`, `penaltyApi`, `cancellationLogApi`, `qnaApi`, `maintenanceApi`, `authApi`). 새 백엔드 컨트롤러를 다룰 때는 여기에 클라이언트를 추가한다. `api()`는 비-2xx 응답을 `ApiError(statusCode, message, error)`로 던지고, 빈 200 body(DELETE 등)는 `undefined`로 처리한다.
- **lib/types.ts** — 모든 엔티티 + DTO 타입. `BACKEND.md` §5의 엔티티 필드와 일치시킨다 (boolean은 `1|0` 숫자, datetime은 ISO 문자열).
- **lib/reservation-utils.ts** — `GET /user`(reservations·room 관계 포함)에서 예약을 평탄화. 예약을 참조하는 화면(usage-log/cancellation/penalty-history)의 선택기에서 공통 사용 — 백엔드에 "전체 예약" 엔드포인트가 없기 때문.
- **lib/date-utils.ts** — `datetime-local` input ↔ ISO 문자열 변환(`toDateTimeLocalString`/`fromDateTimeLocalString`/`toISOString`) 및 표시용 포맷. datetime 필드는 백엔드에 ISO 8601로 전송.

### 인증 (백엔드 제약에 맞춘 패턴)
- 백엔드에는 `POST /auth/user/login`, `POST /auth/admin/login` 두 개만 존재 — `/auth/me`나 비밀번호 변경 엔드포인트는 **없다**.
- 로그인 응답(`{ access_token, user|admin }`)을 받아 토큰과 세션 정보(`Session`)를 **localStorage**에 저장한다 (`lib/utils.ts`: `saveAccessToken`/`saveSession`/`readSession`/`clearSession`). 현재 로그인 정보는 `hooks/use-session.ts`의 `useSession()`으로 읽는다 (SSR 하이드레이션 불일치 방지용 `useEffect` 기반).
- `api()`는 매 요청에 `Authorization` 헤더로 토큰을 붙이지만, 백엔드 다른 엔드포인트에는 Guard가 없어 토큰 없이도 접근 가능하다.
- 비밀번호 변경은 전용 엔드포인트 대신 `PATCH /user|/admin/:id`의 `password` 필드로 처리. 비밀번호는 평문 전송 → 백엔드가 bcrypt 해시.

### 페이지/UI 패턴 (App Router)
- `app/(dashboard)/` 라우트 그룹이 사이드바 레이아웃을 공유. 각 도메인은 `page.tsx`(목록/테이블 + 상태 관리) + `*-form-dialog.tsx`(생성/수정 다이얼로그, `isEdit = !!entity`로 분기)로 구성. 새 도메인 화면은 기존 `users/`·`usage-logs/` 페이지의 구조를 그대로 따른다.
- 다중 하위 리소스(penalty 정책/이력, qna 질문/답변/매핑)는 한 페이지 안에서 **탭**으로 분리.
- 공통 UI 빌딩블록: `PageHeader`, `LoadingPage`, `ErrorPage`, `EmptyState`, `ConfirmDialog`, 상태 배지(`components/status-badge.tsx`의 `RoomStatusBadge`/`ReservationStatusBadge`/`QuestionStatusBadge`/`ActiveBadge`/`GenericStatusBadge`). shadcn/ui 컴포넌트는 `components/ui/`.
- 에러 처리 규칙(`BACKEND.md` §9·§10): 유저/어드민 기능을 구분하지 않고, 백엔드가 반환한 오류 메시지를 `toast.error()`로 그대로 노출. UNIQUE 충돌(usage-log·qna-mapping 중복) 등 500은 사용자 친화 메시지로 안내.
- 클라이언트 검증은 백엔드에 ValidationPipe가 없으므로 프론트에서 수행 (`lib/validation.ts` 또는 폼 내 인라인).

### 경로 별칭
- `@/*` → 저장소 루트 (`tsconfig.json`). 예: `@/lib/api`, `@/components/ui/button`.
