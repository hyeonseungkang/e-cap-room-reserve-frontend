import type { User, Reservation } from "@/lib/types";
import { formatReservationPeriod } from "@/lib/date-utils";

export type ReservationWithUser = Reservation & {
  userName: string;
  userId: number;
};

// GET /user 응답(reservations, reservations.room 관계 포함)에서
// 전체 예약 목록을 평탄화하여 사용자 이름과 함께 반환한다.
export function flattenReservations(users: User[] | undefined): ReservationWithUser[] {
  if (!users) return [];
  const result: ReservationWithUser[] = [];
  users.forEach((user) => {
    (user.reservations || []).forEach((res) => {
      result.push({ ...res, userName: user.name, userId: user.user_id });
    });
  });
  return result.sort((a, b) => b.reservation_id - a.reservation_id);
}

// 예약 선택지 라벨 (예: "#12 · 대회의실 · 홍길동 · 01월 02일 ...")
export function reservationLabel(res: ReservationWithUser): string {
  const room = res.room?.room_name ?? "회의실?";
  const period = formatReservationPeriod(res.start_time, res.end_time);
  return `#${res.reservation_id} · ${room} · ${res.userName} · ${period}`;
}
