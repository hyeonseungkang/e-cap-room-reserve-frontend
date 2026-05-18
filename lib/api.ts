import type {
    Admin,
    MeetingRoom,
    RoomEquipment,
    User,
    Reservation,
    CreateUserDto,
    UpdateUserDto,
    CreateAdminDto,
    UpdateAdminDto,
    CreateMeetingRoomDto,
    UpdateMeetingRoomDto,
    CreateEquipmentDto,
    UpdateEquipmentDto,
    CreateReservationDto,
    UpdateReservationDto,
    ApiErrorResponse, UpdatePasswordDto, Me, Login,
} from "./types";
import {readAccessToken} from "@/lib/utils";

const BASE_URL = "https://e-cap-room-reserve-backend.netlify.app";

export class ApiError extends Error {
  statusCode: number;
  error: string;

  constructor(statusCode: number, message: string, error: string = "Error") {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.name = "ApiError";
  }
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", "Authorization": readAccessToken() },
    ...options,
  });

  // DELETE 응답 (빈 body)
  if (res.status === 200 && res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  if (!res.ok) {
    let err: ApiErrorResponse;
    try {
      err = await res.json();
    } catch {
      throw new ApiError(res.status, "서버 오류가 발생했습니다.", "Error");
    }
    throw new ApiError(err.statusCode, err.message, err.error);
  }

  return res.json();
}

// User API
export const userApi = {
  getAll: () => api<User[]>("/user"),
  getById: (id: number) => api<User>(`/user/${id}`),
  create: (data: CreateUserDto) =>
    api<User>("/user", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateUserDto) =>
    api<User>(`/user/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api<void>(`/user/${id}`, {
      method: "DELETE",
    }),
};

// Reservation API
export const reservationApi = {
  getByUser: (userId: number) =>
    api<Reservation[]>(`/user/${userId}/reservations`),
  getById: (reservationId: number) =>
    api<Reservation>(`/user/reservations/${reservationId}`),
  create: (userId: number, data: CreateReservationDto) =>
    api<Reservation>(`/user/${userId}/reservations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (reservationId: number, data: UpdateReservationDto) =>
    api<Reservation>(`/user/reservations/${reservationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (reservationId: number) =>
    api<void>(`/user/reservations/${reservationId}`, {
      method: "DELETE",
    }),
};

// Meeting Room API
export const meetingRoomApi = {
  getAll: () => api<MeetingRoom[]>("/meeting-room"),
  getById: (id: number) => api<MeetingRoom>(`/meeting-room/${id}`),
  create: (data: CreateMeetingRoomDto) =>
    api<MeetingRoom>("/meeting-room", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateMeetingRoomDto) =>
    api<MeetingRoom>(`/meeting-room/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api<void>(`/meeting-room/${id}`, {
      method: "DELETE",
    }),
};

// Equipment API
export const equipmentApi = {
  getByRoom: (roomId: number) =>
    api<RoomEquipment[]>(`/meeting-room/${roomId}/equipment`),
  create: (roomId: number, data: CreateEquipmentDto) =>
    api<RoomEquipment>(`/meeting-room/${roomId}/equipment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (roomId: number, equipmentId: number, data: UpdateEquipmentDto) =>
    api<RoomEquipment>(`/meeting-room/${roomId}/equipment/${equipmentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (roomId: number, equipmentId: number) =>
    api<void>(`/meeting-room/${roomId}/equipment/${equipmentId}`, {
      method: "DELETE",
    }),
};

// Admin API
export const adminApi = {
  getAll: () => api<Admin[]>("/admin"),
  getById: (id: number) => api<Admin>(`/admin/${id}`),
  create: (data: CreateAdminDto) =>
    api<Admin>("/admin", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateAdminDto) =>
    api<Admin>(`/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api<void>(`/admin/${id}`, {
      method: "DELETE",
    }),
};

// Auth API
export const authApi = {
    me: () => api<Me>("/auth/me"),
    login: (data: UpdatePasswordDto) =>
        api<Login>("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updatePassword: (data: UpdatePasswordDto) =>
        api<boolean>("/auth/updatePassword", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// SWR fetcher
export const fetcher = <T>(url: string) => api<T>(url);
