// 도메인 모델 타입 정의 (CLAUDE.md 기반)

export interface Admin {
  admin_id: number;
  name: string;
  email: string;
  department: string | null;
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
  department: string | null;
  phone: string | null;
  role: string; // 기본: "USER"
  created_at: string;
  reservations?: Reservation[];
}

export interface Reservation {
  reservation_id: number;
  start_time: string;
  end_time: string;
  purpose: string | null;
  reservation_status: string; // 기본: "RESERVED"
  created_at: string;
  user?: User;
  room?: MeetingRoom;
}

// 상태 열거형 (문자열 타입)
export type UserRole = "USER" | string;
export type RoomStatus = "AVAILABLE" | "MAINTENANCE" | "UNAVAILABLE" | string;
export type ReservationStatus = "RESERVED" | "CANCELLED" | "COMPLETED" | string;

// API 에러 응답 타입
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

// DTO 타입 정의
export interface CreateUserDto {
  name: string;
  email: string;
  department?: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  department?: string;
  phone?: string;
  role?: string;
}

export interface CreateAdminDto {
  name: string;
  email: string;
  department?: string;
}

export interface UpdateAdminDto {
  name?: string;
  email?: string;
  department?: string;
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
  purpose?: string;
}

export interface UpdateReservationDto {
  start_time?: string;
  end_time?: string;
  purpose?: string;
  reservation_status?: string;
}

export interface Me {
  name: string;
  sub: string;
  type: string;

}

export interface Login {
  access_token: string;
}

export interface LoginDto {
  email: string;
  type: string;
  password: string;
}

export interface UpdatePasswordDto {
  email: string;
  type: string;
  password: string;
}
