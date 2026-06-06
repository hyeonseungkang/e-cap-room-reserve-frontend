import type {
    Admin,
    MeetingRoom,
    RoomEquipment,
    User,
    Reservation,
    UsageLog,
    PenaltyPolicy,
    PenaltyHistory,
    CancellationLog,
    Question,
    Answer,
    QnaMapping,
    RoomMaintenanceLog,
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
    CreateUsageLogDto,
    UpdateUsageLogDto,
    CreatePenaltyPolicyDto,
    UpdatePenaltyPolicyDto,
    CreatePenaltyHistoryDto,
    UpdatePenaltyHistoryDto,
    CreateCancellationLogDto,
    UpdateCancellationLogDto,
    CreateQuestionDto,
    UpdateQuestionDto,
    CreateAnswerDto,
    UpdateAnswerDto,
    CreateQnaMappingDto,
    CreateMaintenanceLogDto,
    UpdateMaintenanceLogDto,
    ApiErrorResponse,
    LoginDto,
    UserLoginResponse,
    AdminLoginResponse,
} from "./types";
import {readAccessToken} from "@/lib/utils";

const BASE_URL = "/api/proxy";

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

  // DELETE 응답 또는 빈 body (void) 처리
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

// UsageLog API
export const usageLogApi = {
  getAll: () => api<UsageLog[]>("/usage-log"),
  getById: (id: number) => api<UsageLog>(`/usage-log/${id}`),
  getByReservation: (reservationId: number) =>
    api<UsageLog>(`/usage-log/reservation/${reservationId}`),
  create: (data: CreateUsageLogDto) =>
    api<UsageLog>("/usage-log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateUsageLogDto) =>
    api<UsageLog>(`/usage-log/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api<void>(`/usage-log/${id}`, {
      method: "DELETE",
    }),
};

// Penalty API (정책 + 이력)
export const penaltyApi = {
  // 정책
  getPolicies: () => api<PenaltyPolicy[]>("/penalty/policies"),
  getPolicy: (id: number) => api<PenaltyPolicy>(`/penalty/policies/${id}`),
  createPolicy: (data: CreatePenaltyPolicyDto) =>
    api<PenaltyPolicy>("/penalty/policies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePolicy: (id: number, data: UpdatePenaltyPolicyDto) =>
    api<PenaltyPolicy>(`/penalty/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deletePolicy: (id: number) =>
    api<void>(`/penalty/policies/${id}`, {
      method: "DELETE",
    }),
  // 이력
  getHistories: () => api<PenaltyHistory[]>("/penalty/history"),
  getHistory: (id: number) => api<PenaltyHistory>(`/penalty/history/${id}`),
  getHistoryByReservation: (reservationId: number) =>
    api<PenaltyHistory[]>(`/penalty/history/reservation/${reservationId}`),
  createHistory: (data: CreatePenaltyHistoryDto) =>
    api<PenaltyHistory>("/penalty/history", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateHistory: (id: number, data: UpdatePenaltyHistoryDto) =>
    api<PenaltyHistory>(`/penalty/history/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteHistory: (id: number) =>
    api<void>(`/penalty/history/${id}`, {
      method: "DELETE",
    }),
};

// CancellationLog API
export const cancellationLogApi = {
  getAll: () => api<CancellationLog[]>("/cancellation-log"),
  getById: (id: number) => api<CancellationLog>(`/cancellation-log/${id}`),
  getByReservation: (reservationId: number) =>
    api<CancellationLog[]>(`/cancellation-log/reservation/${reservationId}`),
  create: (data: CreateCancellationLogDto) =>
    api<CancellationLog>("/cancellation-log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateCancellationLogDto) =>
    api<CancellationLog>(`/cancellation-log/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api<void>(`/cancellation-log/${id}`, {
      method: "DELETE",
    }),
};

// QnA API (질문 + 답변 + 매핑)
export const qnaApi = {
  // 질문
  getQuestions: () => api<Question[]>("/qna/questions"),
  getQuestion: (id: number) => api<Question>(`/qna/questions/${id}`),
  createQuestion: (data: CreateQuestionDto) =>
    api<Question>("/qna/questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateQuestion: (id: number, data: UpdateQuestionDto) =>
    api<Question>(`/qna/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteQuestion: (id: number) =>
    api<void>(`/qna/questions/${id}`, {
      method: "DELETE",
    }),
  // 답변
  getAnswers: () => api<Answer[]>("/qna/answers"),
  getAnswer: (id: number) => api<Answer>(`/qna/answers/${id}`),
  createAnswer: (data: CreateAnswerDto) =>
    api<Answer>("/qna/answers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAnswer: (id: number, data: UpdateAnswerDto) =>
    api<Answer>(`/qna/answers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAnswer: (id: number) =>
    api<void>(`/qna/answers/${id}`, {
      method: "DELETE",
    }),
  // 매핑
  getMappings: () => api<QnaMapping[]>("/qna/mappings"),
  getMapping: (id: number) => api<QnaMapping>(`/qna/mappings/${id}`),
  getMappingByQuestion: (questionId: number) =>
    api<QnaMapping>(`/qna/mappings/question/${questionId}`),
  createMapping: (data: CreateQnaMappingDto) =>
    api<QnaMapping>("/qna/mappings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteMapping: (id: number) =>
    api<void>(`/qna/mappings/${id}`, {
      method: "DELETE",
    }),
};

// Maintenance API
export const maintenanceApi = {
  getAll: () => api<RoomMaintenanceLog[]>("/maintenance"),
  getById: (id: number) => api<RoomMaintenanceLog>(`/maintenance/${id}`),
  getByRoom: (roomId: number) =>
    api<RoomMaintenanceLog[]>(`/maintenance/room/${roomId}`),
  create: (data: CreateMaintenanceLogDto) =>
    api<RoomMaintenanceLog>("/maintenance", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateMaintenanceLogDto) =>
    api<RoomMaintenanceLog>(`/maintenance/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    api<void>(`/maintenance/${id}`, {
      method: "DELETE",
    }),
};

// Auth API
export const authApi = {
  userLogin: (data: LoginDto) =>
    api<UserLoginResponse>("/auth/user/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminLogin: (data: LoginDto) =>
    api<AdminLoginResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// SWR fetcher
export const fetcher = <T>(url: string) => api<T>(url);
