// 도메인 모델 타입 정의 (BACKEND.md 기반)

export interface Admin {
  admin_id: number;
  name: string;
  email: string;
  password?: string;
  department: string | null;
  is_active: number; // 1 또는 0
  created_at: string;
  rooms?: MeetingRoom[];
}

export interface MeetingRoom {
  room_id: number;
  room_name: string;
  location: string;
  capacity: number;
  room_status: string; // 기본: "AVAILABLE"
  admin?: Admin | null;
  equipment?: RoomEquipment[];
  reservations?: Reservation[];
}

export interface RoomEquipment {
  equipment_id: number;
  equipment_name: string;
  quantity: number;
  room?: MeetingRoom;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  password?: string;
  department: string | null;
  phone: string | null;
  role: string; // 기본: "USER"
  is_active: number; // 1 또는 0
  created_at: string;
  reservations?: Reservation[];
}

export interface Reservation {
  reservation_id: number;
  start_time: string;
  end_time: string;
  participant_count: number | null;
  purpose: string | null;
  reservation_status: string; // 기본: "RESERVED"
  created_at: string;
  user?: User;
  room?: MeetingRoom;
}

export interface UsageLog {
  usage_id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  usage_status: string | null;
  reservation?: Reservation;
}

export interface PenaltyPolicy {
  penalty_policy_id: number;
  penalty_type: string;
  penalty_reason: string | null;
  restriction_days: number | null;
  created_at: string;
}

export interface PenaltyHistory {
  penalty_history_id: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  reservation?: Reservation;
}

export interface CancellationLog {
  cancellation_id: number;
  cancelled_at: string;
  cancel_reason: string | null;
  is_late_cancel: number; // 1 또는 0
  reservation?: Reservation;
}

export interface Question {
  question_id: number;
  title: string;
  content: string;
  question_status: string; // 기본: "PENDING"
  created_at: string;
  user?: User;
}

export interface Answer {
  answer_id: number;
  content: string;
  created_at: string;
  admin?: Admin | null;
}

export interface QnaMapping {
  mapping_id: number;
  created_at: string;
  question?: Question;
  answer?: Answer;
}

export interface RoomMaintenanceLog {
  maintenance_id: number;
  maintenance_type: string | null;
  maintenance_status: string | null;
  room?: MeetingRoom;
  admin?: Admin | null;
}

// 상태 열거형 (문자열 타입)
export type UserRole = "USER" | "STAFF" | string;
export type RoomStatus = "AVAILABLE" | "MAINTENANCE" | "UNAVAILABLE" | string;
export type ReservationStatus = "RESERVED" | "CANCELLED" | "COMPLETED" | string;
export type QuestionStatus = "PENDING" | "ANSWERED" | string;

// API 에러 응답 타입
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

// ===== DTO 타입 정의 =====

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  department?: string;
  phone?: string;
  role?: string;
  is_active?: number;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  department?: string;
  phone?: string;
  role?: string;
  is_active?: number;
}

export interface CreateAdminDto {
  name: string;
  email: string;
  password?: string;
  department?: string;
  is_active?: number;
}

export interface UpdateAdminDto {
  name?: string;
  email?: string;
  password?: string;
  department?: string;
  is_active?: number;
}

export interface CreateMeetingRoomDto {
  room_name: string;
  location: string;
  capacity: number;
  room_status?: string;
  admin_id?: number;
}

export interface UpdateMeetingRoomDto {
  room_name?: string;
  location?: string;
  capacity?: number;
  room_status?: string;
  admin_id?: number | null;
}

export interface CreateEquipmentDto {
  equipment_name: string;
  quantity?: number;
}

export interface UpdateEquipmentDto {
  equipment_name?: string;
  quantity?: number;
}

export interface CreateReservationDto {
  start_time: string;
  end_time: string;
  room_id: number;
  participant_count?: number;
  purpose?: string;
}

export interface UpdateReservationDto {
  start_time?: string;
  end_time?: string;
  participant_count?: number;
  purpose?: string;
  reservation_status?: string;
}

export interface CreateUsageLogDto {
  reservation_id: number;
  check_in_time?: string;
  check_out_time?: string;
  usage_status?: string;
}

export interface UpdateUsageLogDto {
  check_in_time?: string;
  check_out_time?: string;
  usage_status?: string;
}

export interface CreatePenaltyPolicyDto {
  penalty_type: string;
  penalty_reason?: string;
  restriction_days?: number;
}

export interface UpdatePenaltyPolicyDto {
  penalty_type?: string;
  penalty_reason?: string;
  restriction_days?: number;
}

export interface CreatePenaltyHistoryDto {
  reservation_id: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdatePenaltyHistoryDto {
  start_date?: string;
  end_date?: string;
}

export interface CreateCancellationLogDto {
  reservation_id: number;
  cancel_reason?: string;
  is_late_cancel?: number;
}

export interface UpdateCancellationLogDto {
  cancel_reason?: string;
  is_late_cancel?: number;
}

export interface CreateQuestionDto {
  user_id: number;
  title: string;
  content: string;
  question_status?: string;
}

export interface UpdateQuestionDto {
  title?: string;
  content?: string;
  question_status?: string;
}

export interface CreateAnswerDto {
  admin_id: number;
  content: string;
}

export interface UpdateAnswerDto {
  content?: string;
}

export interface CreateQnaMappingDto {
  question_id: number;
  answer_id: number;
}

export interface CreateMaintenanceLogDto {
  room_id: number;
  admin_id?: number;
  maintenance_type?: string;
  maintenance_status?: string;
}

export interface UpdateMaintenanceLogDto {
  admin_id?: number | null;
  maintenance_type?: string;
  maintenance_status?: string;
}

// ===== Auth 타입 =====

export type AccountType = "user" | "admin";

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  access_token: string;
  user: User;
}

export interface AdminLoginResponse {
  access_token: string;
  admin: Admin;
}

// localStorage 에 저장되는 로그인 세션 정보
export interface Session {
  id: number;
  name: string;
  email: string;
  type: AccountType;
}
