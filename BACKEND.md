# CLAUDE.md

This file is the single source of truth for the e-cap-room-reserve backend.
Frontend developers and Claude can build against or modify this project using only this file.

---

## Commands

```bash
npm run start:dev      # Start with hot reload (development)
npm run build          # Compile TypeScript to dist/
npm run start:prod     # Run compiled production build
npm run lint           # ESLint with auto-fix
npm run format         # Prettier format
npm test               # Run Jest unit tests
npm run test:watch     # Tests in watch mode
npm run test:cov       # Tests with coverage
npm run test:e2e       # End-to-end tests
```

Single test file:
```bash
npx jest src/user/user.service.spec.ts
```

---

## 1. Project Overview

사내 회의실 예약 및 유지보수 관리 시스템.
사용자의 회의실 예약/이용 현황, 패널티 관리, QnA 문의, 관리자의 유지보수 로그를 통합 관리하는 엔터프라이즈 백엔드.

| 레이어 | 기술 |
| :---- | :---- |
| Framework | NestJS 11 (Express adapter) |
| ORM | TypeORM 0.3 |
| Database | better-sqlite3 (`data/db/db.sqlite3`), `synchronize: true` |
| Validation | 없음 — ValidationPipe 미적용, class-validator 미사용 |
| API Docs | Swagger UI — `GET /api` |
| Template | Handlebars (.hbs), static assets `/public` |
| Auth | JWT (`@nestjs/jwt`) — 로그인 성공 시 Bearer 토큰 발급. 다른 엔드포인트에는 Guard 미적용(공개). 비밀번호는 bcrypt(saltRounds=10)로 해시 저장 |
| CORS | 전체 허용 (`origin: '*'`) |
| Port | `process.env.PORT ?? 3000` |
| Scheduler | `@nestjs/schedule` — 1분마다 end_time 지난 RESERVED 예약을 COMPLETED로 자동 전환 |

---

## 2. Base URL & Global Rules

```
http://localhost:3000
```

- 글로벌 prefix 없음 (`/api`는 Swagger UI 경로)
- 응답 인터셉터/래퍼 없음 — 엔티티 객체가 JSON으로 그대로 반환
- 페이지네이션 없음 — 목록 API는 전체 레코드 반환
- Authorization 헤더 불필요

### HTTP 상태 코드

| 상태 | 원인 |
| :---- | :---- |
| 200 | 성공 |
| 400 | URL 파라미터가 숫자 아님 또는 중복 예약 시간 |
| 404 | 해당 ID 리소스 없음 |
| 500 | DB 제약 조건 위반 (FK, UNIQUE 등) |

---

## 3. Directory Structure

```
src/
├── main.ts
├── app.module.ts
├── env.ts
├── auth/                          # 인증 모듈 — 사용자/관리자 로그인, JWT 발급
│   ├── auth.module.ts             # JwtModule 등록 (secret: JWT_SECRET env or 'ecap-secret', 7d)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/
│       ├── login.dto.ts           # { email, password }
│       ├── me.dto.ts
│       └── update-password.dto.ts
├── user/                          # users + reservations 테이블
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── entity/
│   │   ├── user.entity.ts
│   │   └── reservation.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       ├── create-reservation.dto.ts
│       └── update-reservation.dto.ts
├── admin/                         # admins 테이블
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   ├── entity/
│   │   └── admin.entity.ts
│   └── dto/
│       ├── create-admin.dto.ts
│       └── update-admin.dto.ts
├── meeting-room/                  # meeting_rooms + room_equipment 테이블
│   ├── meeting-room.module.ts
│   ├── meeting-room.controller.ts
│   ├── meeting-room.service.ts
│   ├── entity/
│   │   ├── meeting-room.entity.ts
│   │   └── room-equipment.entity.ts
│   └── dto/
│       ├── create-meeting-room.dto.ts
│       ├── update-meeting-room.dto.ts
│       ├── create-room-equipment.dto.ts
│       └── update-room-equipment.dto.ts
├── usage-log/                     # usage_logs 테이블
│   ├── usage-log.module.ts
│   ├── usage-log.controller.ts
│   ├── usage-log.service.ts
│   ├── entity/
│   │   └── usage-log.entity.ts
│   └── dto/
│       ├── create-usage-log.dto.ts
│       └── update-usage-log.dto.ts
├── penalty/                       # penalty_policies + penalty_history 테이블
│   ├── penalty.module.ts
│   ├── penalty.controller.ts
│   ├── penalty.service.ts
│   ├── entity/
│   │   ├── penalty-policy.entity.ts
│   │   └── penalty-history.entity.ts
│   └── dto/
│       ├── create-penalty-policy.dto.ts
│       ├── update-penalty-policy.dto.ts
│       ├── create-penalty-history.dto.ts
│       └── update-penalty-history.dto.ts
├── cancellation-log/              # cancellation_logs 테이블
│   ├── cancellation-log.module.ts
│   ├── cancellation-log.controller.ts
│   ├── cancellation-log.service.ts
│   ├── entity/
│   │   └── cancellation-log.entity.ts
│   └── dto/
│       ├── create-cancellation-log.dto.ts
│       └── update-cancellation-log.dto.ts
├── qna/                           # questions + answers + qna_mappings 테이블
│   ├── qna.module.ts
│   ├── qna.controller.ts
│   ├── qna.service.ts
│   ├── entity/
│   │   ├── question.entity.ts
│   │   ├── answer.entity.ts
│   │   └── qna-mapping.entity.ts
│   └── dto/
│       ├── create-question.dto.ts
│       ├── update-question.dto.ts
│       ├── create-answer.dto.ts
│       ├── update-answer.dto.ts
│       └── create-qna-mapping.dto.ts
└── maintenance/                   # room_maintenance_logs 테이블
    ├── maintenance.module.ts
    ├── maintenance.controller.ts
    ├── maintenance.service.ts
    ├── entity/
    │   └── room-maintenance-log.entity.ts
    └── dto/
        ├── create-maintenance-log.dto.ts
        └── update-maintenance-log.dto.ts
```

---

## 4. DB 테이블 ↔ 모듈 매핑

| DB 테이블 | 모듈 | 엔티티 클래스 |
| :---- | :---- | :---- |
| users | user | User |
| admins | admin | Admin |
| meeting\_rooms | meeting-room | MeetingRoom |
| room\_equipment | meeting-room | RoomEquipment |
| reservations | user | Reservation |
| usage\_logs | usage-log | UsageLog |
| penalty\_policies | penalty | PenaltyPolicy |
| penalty\_history | penalty | PenaltyHistory |
| cancellation\_logs | cancellation-log | CancellationLog |
| questions | qna | Question |
| answers | qna | Answer |
| qna\_mappings | qna | QnaMapping |
| room\_maintenance\_logs | maintenance | RoomMaintenanceLog |

---

## 5. Entities (실제 TypeORM 엔티티 필드 전체)

### User (`users` 테이블)
```typescript
@Entity('users')
class User {
  @PrimaryGeneratedColumn('increment')
  user_id: number

  @Column({ length: 50 })
  name: string

  @Column({ length: 100, unique: true })
  email: string

  @Column({ length: 100, nullable: true })
  password: string

  @Column({ length: 100, nullable: true })
  department: string

  @Column({ length: 20, nullable: true })
  phone: string

  @Column({ length: 20, default: 'USER' })
  role: string                        // 'USER' | 'STAFF' | ...

  @Column({ type: 'int', default: 1 })
  is_active: number                   // 1 또는 0

  @CreateDateColumn()
  created_at: Date

  @OneToMany(() => Reservation, r => r.user)
  reservations: Reservation[]
}
```

### Admin (`admins` 테이블)
```typescript
@Entity('admins')
class Admin {
  @PrimaryGeneratedColumn('increment')
  admin_id: number

  @Column({ length: 50 })
  name: string

  @Column({ length: 100, unique: true })
  email: string

  @Column({ length: 100, nullable: true })
  password: string

  @Column({ length: 100, nullable: true })
  department: string

  @Column({ type: 'int', default: 1 })
  is_active: number                   // 1 또는 0

  @CreateDateColumn()
  created_at: Date

  @OneToMany(() => MeetingRoom, r => r.admin)
  rooms: MeetingRoom[]
}
```

### MeetingRoom (`meeting_rooms` 테이블)
```typescript
@Entity('meeting_rooms')
class MeetingRoom {
  @PrimaryGeneratedColumn('increment')
  room_id: number

  @Column({ length: 100 })
  room_name: string

  @Column({ length: 100 })
  location: string

  @Column()
  capacity: number

  @Column({ length: 20, default: 'AVAILABLE' })
  room_status: string                 // 'AVAILABLE' | 'MAINTENANCE' | ...

  @ManyToOne(() => Admin, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin                        // nullable

  @OneToMany(() => RoomEquipment, e => e.room)
  equipment: RoomEquipment[]

  @OneToMany(() => Reservation, r => r.room)
  reservations: Reservation[]
}
```

### RoomEquipment (`room_equipment` 테이블)
```typescript
@Entity('room_equipment')
class RoomEquipment {
  @PrimaryGeneratedColumn('increment')
  equipment_id: number

  @Column({ length: 100 })
  equipment_name: string

  @Column({ default: 1 })
  quantity: number

  @ManyToOne(() => MeetingRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: MeetingRoom
}
```

### Reservation (`reservations` 테이블)
```typescript
@Entity('reservations')
@Check(`"end_time" > "start_time"`)
class Reservation {
  @PrimaryGeneratedColumn('increment')
  reservation_id: number

  @Column({ type: 'datetime' })
  start_time: Date

  @Column({ type: 'datetime' })
  end_time: Date

  @Column({ nullable: true })
  participant_count: number

  @Column({ length: 255, nullable: true })
  purpose: string

  @Column({ length: 20, default: 'RESERVED' })
  reservation_status: string          // 'RESERVED' | 'CANCELLED' | 'COMPLETED'

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => MeetingRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: MeetingRoom
}
```
> 스케줄러: 매 1분마다 `end_time <= now AND reservation_status = 'RESERVED'` 인 예약을 `COMPLETED`로 자동 전환.

### UsageLog (`usage_logs` 테이블)
```typescript
@Entity('usage_logs')
class UsageLog {
  @PrimaryGeneratedColumn('increment')
  usage_id: number

  @Column({ type: 'datetime', nullable: true })
  check_in_time: Date

  @Column({ type: 'datetime', nullable: true })
  check_out_time: Date

  @Column({ length: 20, nullable: true })
  usage_status: string

  @OneToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })    // UNIQUE 제약 → 예약 1건당 이용로그 1건
  reservation: Reservation
}
```

### PenaltyPolicy (`penalty_policies` 테이블)
```typescript
@Entity('penalty_policies')
class PenaltyPolicy {
  @PrimaryGeneratedColumn('increment')
  penalty_policy_id: number

  @Column({ length: 50 })
  penalty_type: string                // 예: '당일 긴급 취소', '노쇼'

  @Column({ length: 255, nullable: true })
  penalty_reason: string

  @Column({ nullable: true })
  restriction_days: number

  @CreateDateColumn()
  created_at: Date
}
```

### PenaltyHistory (`penalty_history` 테이블)
```typescript
@Entity('penalty_history')
class PenaltyHistory {
  @PrimaryGeneratedColumn('increment')
  penalty_history_id: number

  @Column({ type: 'datetime', nullable: true })
  start_date: Date

  @Column({ type: 'datetime', nullable: true })
  end_date: Date

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation
}
```

### CancellationLog (`cancellation_logs` 테이블)
```typescript
@Entity('cancellation_logs')
class CancellationLog {
  @PrimaryGeneratedColumn('increment')
  cancellation_id: number

  @CreateDateColumn()
  cancelled_at: Date

  @Column({ length: 255, nullable: true })
  cancel_reason: string

  @Column({ type: 'int', default: 0 })
  is_late_cancel: number              // 1 또는 0

  @ManyToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation
}
```

### Question (`questions` 테이블)
```typescript
@Entity('questions')
class Question {
  @PrimaryGeneratedColumn('increment')
  question_id: number

  @Column({ length: 200 })
  title: string

  @Column({ type: 'text' })           // CLOB 대응
  content: string

  @Column({ length: 20, default: 'PENDING' })
  question_status: string             // 'PENDING' | 'ANSWERED'

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User
}
```

### Answer (`answers` 테이블)
```typescript
@Entity('answers')
class Answer {
  @PrimaryGeneratedColumn('increment')
  answer_id: number

  @Column({ type: 'text' })           // CLOB 대응
  content: string

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin | null                 // 관리자 삭제 시 null, 답변은 보존
}
```

### QnaMapping (`qna_mappings` 테이블)
```typescript
@Entity('qna_mappings')
class QnaMapping {
  @PrimaryGeneratedColumn('increment')
  mapping_id: number

  @CreateDateColumn()
  created_at: Date

  @OneToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })    // UNIQUE — 질문 1건당 매핑 1건
  question: Question

  @OneToOne(() => Answer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answer_id' })      // UNIQUE — 답변 1건당 매핑 1건
  answer: Answer
}
```

### RoomMaintenanceLog (`room_maintenance_logs` 테이블)
```typescript
@Entity('room_maintenance_logs')
class RoomMaintenanceLog {
  @PrimaryGeneratedColumn('increment')
  maintenance_id: number

  @Column({ length: 50, nullable: true })
  maintenance_type: string            // 예: '정기 청소', '프로젝터 교체'

  @Column({ length: 20, nullable: true })
  maintenance_status: string          // 예: '진행중', '완료'

  @ManyToOne(() => MeetingRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: MeetingRoom

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin | null                 // 관리자 삭제 시 null, 로그는 보존
}
```

---

## 6. API Endpoints 전체 명세

### 공통 규칙
- `?` 표시 필드는 선택(optional)
- `relations` 항목은 해당 API 응답에 포함되는 JOIN 관계
- 배열 반환 API는 전체 레코드 반환 (페이지네이션 없음)

---

### 6-1. Auth — `@Controller('auth')`

> JWT는 `Authorization: Bearer <token>` 헤더로 사용. 다른 엔드포인트에는 Guard가 없으므로 토큰 없이도 접근 가능.
> 비밀번호는 POST /user, POST /admin, PATCH /user/:id, PATCH /admin/:id 호출 시 bcrypt(saltRounds=10)로 자동 해시 저장.

#### POST /auth/user/login
사용자 로그인.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "plaintext_password"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "user_id": 1,
    "name": "string",
    "email": "string",
    "department": "string",
    "phone": "string",
    "role": "USER",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```
**401:** 이메일 또는 비밀번호가 올바르지 않습니다 (계정 없음 / 비밀번호 불일치 / password 필드 null)
**401:** 비활성화된 계정입니다 (is_active = 0)

> JWT payload: `{ sub: user_id, type: 'user' }`, 만료: 7일.
> 응답에서 `password` 필드는 제외됨.

---

#### POST /auth/admin/login
관리자 로그인.

**Request body:**
```json
{
  "email": "admin@example.com",
  "password": "plaintext_password"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "admin": {
    "admin_id": 1,
    "name": "string",
    "email": "string",
    "department": "string",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```
**401:** 이메일 또는 비밀번호가 올바르지 않습니다
**401:** 비활성화된 계정입니다 (is_active = 0)

> JWT payload: `{ sub: admin_id, type: 'admin' }`, 만료: 7일.
> 응답에서 `password` 필드는 제외됨.

---

### 6-3. User — `@Controller('user')`

#### POST /user
사용자 생성.

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password?": "string",
  "department?": "string",
  "phone?": "string",
  "role?": "string",
  "is_active?": 1
}
```
**Response:** `User` 객체 (relations 없음)

---

#### GET /user
사용자 전체 목록 조회.

**Response:** `User[]` (relations: `reservations`, `reservations.room`)

---

#### GET /user/:id
단일 사용자 조회.

**Response:** `User` (relations: `reservations`)
**404:** User #id not found

---

#### PATCH /user/:id
사용자 정보 수정.

**Request body:**
```json
{
  "name?": "string",
  "email?": "string",
  "password?": "string",
  "department?": "string",
  "phone?": "string",
  "role?": "string",
  "is_active?": 1
}
```
**Response:** `User` (relations: `reservations`)

---

#### DELETE /user/:id
사용자 삭제. 연관 `reservations`, `questions` CASCADE 삭제.

**Response:** void (200)
**404:** User #id not found

---

#### POST /user/:userId/reservations
예약 생성.

**Request body:**
```json
{
  "start_time": "2024-01-01T09:00:00.000Z",
  "end_time": "2024-01-01T10:00:00.000Z",
  "participant_count?": 5,
  "purpose?": "string",
  "room_id": 1
}
```
**Response:** `Reservation` (relations: `user`, `room`)
**400:** 선택하신 시간대에 이미 회의실이 예약되어 있습니다 (겹치는 RESERVED 예약 존재 시)
**404:** User #userId not found

> 중복 검사 조건: 같은 room_id, reservation_status='RESERVED', 시간대 겹침 (start_time <= 기존.end_time AND end_time >= 기존.start_time)

---

#### GET /user/:userId/reservations
특정 사용자의 예약 목록.

**Response:** `Reservation[]` (relations: `user`, `room`)

---

#### GET /user/reservations/:reservationId
단일 예약 조회.

**Response:** `Reservation` (relations: `user`, `room`)
**404:** Reservation #reservationId not found

---

#### PATCH /user/reservations/:reservationId
예약 수정.

**Request body:**
```json
{
  "start_time?": "2024-01-01T09:00:00.000Z",
  "end_time?": "2024-01-01T10:00:00.000Z",
  "participant_count?": 5,
  "purpose?": "string",
  "reservation_status?": "CANCELLED"
}
```
**Response:** `Reservation` (relations: `user`, `room`)
**400:** 중복 예약 시간 충돌

---

#### DELETE /user/reservations/:reservationId
예약 삭제. 연관 `usage_logs`, `penalty_history`, `cancellation_logs` CASCADE 삭제.

**Response:** void (200)
**404:** Reservation #reservationId not found

---

### 6-4. Admin — `@Controller('admin')`

#### POST /admin
관리자 생성.

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password?": "string",
  "department?": "string",
  "is_active?": 1
}
```
**Response:** `Admin` 객체 (relations 없음)

---

#### GET /admin
관리자 전체 목록.

**Response:** `Admin[]` (relations: `rooms`)

---

#### GET /admin/:id
단일 관리자 조회.

**Response:** `Admin` (relations: `rooms`)
**404:** Admin #id not found

---

#### PATCH /admin/:id
관리자 정보 수정.

**Request body:**
```json
{
  "name?": "string",
  "email?": "string",
  "password?": "string",
  "department?": "string",
  "is_active?": 1
}
```
**Response:** `Admin` (relations: `rooms`)

---

#### DELETE /admin/:id
관리자 삭제. `meeting_rooms.admin_id`, `answers.admin_id`, `room_maintenance_logs.admin_id` → SET NULL.

**Response:** void (200)
**404:** Admin #id not found

---

### 6-5. MeetingRoom — `@Controller('meeting-room')`

#### POST /meeting-room
회의실 생성.

**Request body:**
```json
{
  "room_name": "string",
  "location": "string",
  "capacity": 10,
  "room_status?": "AVAILABLE",
  "admin_id?": 1
}
```
**Response:** `MeetingRoom` 객체 (relations 없음)

---

#### GET /meeting-room
회의실 전체 목록.

**Response:** `MeetingRoom[]` (relations: `admin`, `equipment`)

---

#### GET /meeting-room/:id
단일 회의실 조회.

**Response:** `MeetingRoom` (relations: `admin`, `equipment`, `reservations`)
**404:** MeetingRoom #id not found

---

#### PATCH /meeting-room/:id
회의실 정보 수정. `admin_id: null` 전달 시 담당 관리자 해제.

**Request body:**
```json
{
  "room_name?": "string",
  "location?": "string",
  "capacity?": 10,
  "room_status?": "MAINTENANCE",
  "admin_id?": 1
}
```
**Response:** `MeetingRoom` (relations: `admin`, `equipment`, `reservations`)

---

#### DELETE /meeting-room/:id
회의실 삭제. 연관 `room_equipment`, `reservations`, `room_maintenance_logs` CASCADE 삭제.

**Response:** void (200)
**404:** MeetingRoom #id not found

---

#### POST /meeting-room/:id/equipment
비품 추가.

**Request body:**
```json
{
  "equipment_name": "string",
  "quantity?": 1
}
```
**Response:** `RoomEquipment` 객체

---

#### GET /meeting-room/:id/equipment
특정 회의실의 비품 목록.

**Response:** `RoomEquipment[]` (relations 없음)

---

#### PATCH /meeting-room/:id/equipment/:equipmentId
비품 수정.

**Request body:**
```json
{
  "equipment_name?": "string",
  "quantity?": 2
}
```
**Response:** `RoomEquipment` 객체
**404:** Equipment #equipmentId in MeetingRoom #id not found

---

#### DELETE /meeting-room/:id/equipment/:equipmentId
비품 삭제.

**Response:** void (200)
**404:** Equipment #equipmentId in MeetingRoom #id not found

---

### 6-6. UsageLog — `@Controller('usage-log')`

> 예약 1건당 UsageLog 1건 (UNIQUE 제약). 중복 생성 시 500.

#### POST /usage-log
이용 로그 생성.

**Request body:**
```json
{
  "reservation_id": 1,
  "check_in_time?": "2024-01-01T09:05:00.000Z",
  "check_out_time?": "2024-01-01T10:00:00.000Z",
  "usage_status?": "string"
}
```
**Response:** `UsageLog` 객체

---

#### GET /usage-log
이용 로그 전체 목록.

**Response:** `UsageLog[]` (relations: `reservation`)

---

#### GET /usage-log/:id
단일 이용 로그 조회.

**Response:** `UsageLog` (relations: `reservation`)
**404:** UsageLog #id not found

---

#### GET /usage-log/reservation/:reservationId
예약 ID로 이용 로그 조회.

**Response:** `UsageLog` (relations: `reservation`)
**404:** UsageLog for Reservation #reservationId not found

---

#### PATCH /usage-log/:id
이용 로그 수정.

**Request body:**
```json
{
  "check_in_time?": "2024-01-01T09:05:00.000Z",
  "check_out_time?": "2024-01-01T10:00:00.000Z",
  "usage_status?": "string"
}
```
**Response:** `UsageLog` (relations: `reservation`)

---

#### DELETE /usage-log/:id
이용 로그 삭제.

**Response:** void (200)
**404:** UsageLog #id not found

---

### 6-7. Penalty — `@Controller('penalty')`

#### POST /penalty/policies
패널티 정책 생성.

**Request body:**
```json
{
  "penalty_type": "string",
  "penalty_reason?": "string",
  "restriction_days?": 3
}
```
**Response:** `PenaltyPolicy` 객체

---

#### GET /penalty/policies
패널티 정책 전체 목록.

**Response:** `PenaltyPolicy[]`

---

#### GET /penalty/policies/:id
단일 패널티 정책 조회.

**Response:** `PenaltyPolicy`
**404:** PenaltyPolicy #id not found

---

#### PATCH /penalty/policies/:id
패널티 정책 수정.

**Request body:**
```json
{
  "penalty_type?": "string",
  "penalty_reason?": "string",
  "restriction_days?": 7
}
```
**Response:** `PenaltyPolicy`

---

#### DELETE /penalty/policies/:id
패널티 정책 삭제.

**Response:** void (200)
**404:** PenaltyPolicy #id not found

---

#### POST /penalty/history
패널티 이력 생성.

**Request body:**
```json
{
  "reservation_id": 1,
  "start_date?": "2024-01-01T00:00:00.000Z",
  "end_date?": "2024-01-04T00:00:00.000Z"
}
```
**Response:** `PenaltyHistory` 객체

---

#### GET /penalty/history
패널티 이력 전체 목록.

**Response:** `PenaltyHistory[]` (relations: `reservation`)

---

#### GET /penalty/history/:id
단일 패널티 이력 조회.

**Response:** `PenaltyHistory` (relations: `reservation`)
**404:** PenaltyHistory #id not found

---

#### GET /penalty/history/reservation/:reservationId
예약 ID로 패널티 이력 목록 조회.

**Response:** `PenaltyHistory[]` (relations: `reservation`)

---

#### PATCH /penalty/history/:id
패널티 이력 수정.

**Request body:**
```json
{
  "start_date?": "2024-01-01T00:00:00.000Z",
  "end_date?": "2024-01-04T00:00:00.000Z"
}
```
**Response:** `PenaltyHistory` (relations: `reservation`)

---

#### DELETE /penalty/history/:id
패널티 이력 삭제.

**Response:** void (200)
**404:** PenaltyHistory #id not found

---

### 6-8. CancellationLog — `@Controller('cancellation-log')`

#### POST /cancellation-log
취소 로그 생성.

**Request body:**
```json
{
  "reservation_id": 1,
  "cancel_reason?": "string",
  "is_late_cancel?": 0
}
```
**Response:** `CancellationLog` 객체

---

#### GET /cancellation-log
취소 로그 전체 목록.

**Response:** `CancellationLog[]` (relations: `reservation`)

---

#### GET /cancellation-log/:id
단일 취소 로그 조회.

**Response:** `CancellationLog` (relations: `reservation`)
**404:** CancellationLog #id not found

---

#### GET /cancellation-log/reservation/:reservationId
예약 ID로 취소 로그 목록 조회.

**Response:** `CancellationLog[]` (relations: `reservation`)

---

#### PATCH /cancellation-log/:id
취소 로그 수정.

**Request body:**
```json
{
  "cancel_reason?": "string",
  "is_late_cancel?": 1
}
```
**Response:** `CancellationLog` (relations: `reservation`)

---

#### DELETE /cancellation-log/:id
취소 로그 삭제.

**Response:** void (200)
**404:** CancellationLog #id not found

---

### 6-9. QnA — `@Controller('qna')`

#### POST /qna/questions
질문 생성.

**Request body:**
```json
{
  "user_id": 1,
  "title": "string",
  "content": "string",
  "question_status?": "PENDING"
}
```
**Response:** `Question` 객체

---

#### GET /qna/questions
질문 전체 목록.

**Response:** `Question[]` (relations: `user`)

---

#### GET /qna/questions/:id
단일 질문 조회.

**Response:** `Question` (relations: `user`)
**404:** Question #id not found

---

#### PATCH /qna/questions/:id
질문 수정.

**Request body:**
```json
{
  "title?": "string",
  "content?": "string",
  "question_status?": "ANSWERED"
}
```
**Response:** `Question` (relations: `user`)

---

#### DELETE /qna/questions/:id
질문 삭제. 연관 `qna_mappings` CASCADE 삭제.

**Response:** void (200)
**404:** Question #id not found

---

#### POST /qna/answers
답변 생성.

**Request body:**
```json
{
  "admin_id": 1,
  "content": "string"
}
```
**Response:** `Answer` 객체

---

#### GET /qna/answers
답변 전체 목록.

**Response:** `Answer[]` (relations: `admin`)

---

#### GET /qna/answers/:id
단일 답변 조회.

**Response:** `Answer` (relations: `admin`)
**404:** Answer #id not found

---

#### PATCH /qna/answers/:id
답변 수정.

**Request body:**
```json
{
  "content?": "string"
}
```
**Response:** `Answer` (relations: `admin`)

---

#### DELETE /qna/answers/:id
답변 삭제. 연관 `qna_mappings` CASCADE 삭제.

**Response:** void (200)
**404:** Answer #id not found

---

#### POST /qna/mappings
질문-답변 매핑 생성.

> 동일 question_id 또는 answer_id로 이미 매핑이 존재하면 UNIQUE 위반으로 500.

**Request body:**
```json
{
  "question_id": 1,
  "answer_id": 1
}
```
**Response:** `QnaMapping` 객체

---

#### GET /qna/mappings
매핑 전체 목록.

**Response:** `QnaMapping[]` (relations: `question`, `answer`)

---

#### GET /qna/mappings/:id
단일 매핑 조회.

**Response:** `QnaMapping` (relations: `question`, `answer`, `answer.admin`)
**404:** QnaMapping #id not found

---

#### GET /qna/mappings/question/:questionId
질문 ID로 매핑 조회.

**Response:** `QnaMapping` (relations: `question`, `answer`, `answer.admin`)
**404:** QnaMapping for Question #questionId not found

---

#### DELETE /qna/mappings/:id
매핑 삭제.

**Response:** void (200)
**404:** QnaMapping #id not found

---

### 6-10. Maintenance — `@Controller('maintenance')`

#### POST /maintenance
유지보수 로그 생성.

**Request body:**
```json
{
  "room_id": 1,
  "admin_id?": 1,
  "maintenance_type?": "string",
  "maintenance_status?": "string"
}
```
**Response:** `RoomMaintenanceLog` 객체

---

#### GET /maintenance
유지보수 로그 전체 목록.

**Response:** `RoomMaintenanceLog[]` (relations: `room`, `admin`)

---

#### GET /maintenance/:id
단일 유지보수 로그 조회.

**Response:** `RoomMaintenanceLog` (relations: `room`, `admin`)
**404:** RoomMaintenanceLog #id not found

---

#### GET /maintenance/room/:roomId
회의실 ID로 유지보수 로그 목록 조회.

**Response:** `RoomMaintenanceLog[]` (relations: `room`, `admin`)

---

#### PATCH /maintenance/:id
유지보수 로그 수정. `admin_id: null` 전달 시 담당 관리자 해제.

**Request body:**
```json
{
  "admin_id?": 1,
  "maintenance_type?": "string",
  "maintenance_status?": "완료"
}
```
**Response:** `RoomMaintenanceLog` (relations: `room`, `admin`)

---

#### DELETE /maintenance/:id
유지보수 로그 삭제.

**Response:** void (200)
**404:** RoomMaintenanceLog #id not found

---

## 7. Cascade & Delete 동작 요약

| 이벤트 | 영향 |
| :---- | :---- |
| User 삭제 | reservations CASCADE 삭제 → usage_logs, penalty_history, cancellation_logs CASCADE 삭제 |
| User 삭제 | questions CASCADE 삭제 → qna_mappings CASCADE 삭제 |
| Admin 삭제 | meeting_rooms.admin_id SET NULL |
| Admin 삭제 | answers.admin_id SET NULL (답변 보존) |
| Admin 삭제 | room_maintenance_logs.admin_id SET NULL (로그 보존) |
| MeetingRoom 삭제 | room_equipment CASCADE 삭제 |
| MeetingRoom 삭제 | reservations CASCADE 삭제 → usage_logs, penalty_history, cancellation_logs CASCADE 삭제 |
| MeetingRoom 삭제 | room_maintenance_logs CASCADE 삭제 |
| Reservation 삭제 | usage_logs CASCADE 삭제 |
| Reservation 삭제 | penalty_history CASCADE 삭제 |
| Reservation 삭제 | cancellation_logs CASCADE 삭제 |
| Question 삭제 | qna_mappings CASCADE 삭제 |
| Answer 삭제 | qna_mappings CASCADE 삭제 |

---

## 8. 상태값 및 플래그 규칙

```typescript
// Boolean 플래그 (is_active, is_late_cancel)
type NumericBoolean = 1 | 0

// 도메인 상태값 (문자열)
type UserRole             = 'USER' | 'STAFF' | string
type RoomStatus           = 'AVAILABLE' | 'MAINTENANCE' | string
type ReservationStatus    = 'RESERVED' | 'CANCELLED' | 'COMPLETED' | string
type QuestionStatus       = 'PENDING' | 'ANSWERED' | string
type UsageStatus          = string  // 정해진 enum 없음
type MaintenanceStatus    = string  // 예: '진행중', '완료'
```

---

## 9. Frontend 연동 시 주의사항

1. **로그인 및 비밀번호** — POST /auth/user/login, POST /auth/admin/login으로 JWT 발급. 비밀번호는 POST/PATCH /user, /admin 호출 시 서버에서 bcrypt 해시 처리. 평문 비밀번호를 그대로 전송할 것. `JWT_SECRET` 환경변수를 설정하지 않으면 기본값 `'ecap-secret'` 사용 (운영 환경에서 반드시 변경).

2. **UsageLog UNIQUE 제약** — 같은 `reservation_id`로 UsageLog를 두 번 POST하면 500 반환. 사전에 `GET /usage-log/reservation/:id`로 존재 여부를 확인할 것.

3. **QnaMapping UNIQUE 제약** — 같은 `question_id` 또는 `answer_id`로 매핑이 이미 존재하면 500. 사전에 `GET /qna/mappings/question/:id`로 확인할 것.

4. **예약 중복 방지** — POST/PATCH 예약 시 내부에서 같은 회의실의 RESERVED 예약 시간 겹침을 검사하여 400 반환.

5. **예약 자동 완료** — 매 1분마다 `end_time`이 지난 RESERVED 예약이 자동으로 COMPLETED로 변경됨.

6. **날짜 형식** — `datetime` 타입 필드는 ISO 8601 문자열 (`"2024-01-01T09:00:00.000Z"`) 로 전송할 것.

7. **CORS** — 개발 서버 `http://localhost:3000`에 모든 origin 허용.

8. **Swagger** — `GET http://localhost:3000/api` 에서 전체 API 목록 확인 가능.

9. **권한, 접근 및 기타 오류 발생 시** — 프론트엔드에서 오류창만을 띄울 것.

10. **유저, 어드민 기능 구분 불필요** — 백엔드에서 반환하는 오류를 가진 오류창만을 띄울 것. 코드 간결함을 위함임.
