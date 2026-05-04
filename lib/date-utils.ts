import { format, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";

// SQLite datetime 문자열을 Date 객체로 파싱
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  return isValid(date) ? date : new Date();
}

// 날짜 포맷팅 함수들
export function formatDate(dateString: string): string {
  const date = parseDate(dateString);
  return format(date, "yyyy년 MM월 dd일", { locale: ko });
}

export function formatDateTime(dateString: string): string {
  const date = parseDate(dateString);
  return format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko });
}

export function formatTime(dateString: string): string {
  const date = parseDate(dateString);
  return format(date, "HH:mm", { locale: ko });
}

export function formatShortDate(dateString: string): string {
  const date = parseDate(dateString);
  return format(date, "MM/dd", { locale: ko });
}

// ISO 8601 형식으로 변환 (API 전송용)
export function toISOString(date: Date): string {
  return date.toISOString();
}

// datetime-local input용 포맷
export function toDateTimeLocalString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

// datetime-local input 값을 Date로 변환
export function fromDateTimeLocalString(value: string): Date {
  return parseISO(value);
}

// 예약 기간 표시
export function formatReservationPeriod(startTime: string, endTime: string): string {
  const start = parseDate(startTime);
  const end = parseDate(endTime);

  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  if (sameDay) {
    return `${format(start, "yyyy년 MM월 dd일", { locale: ko })} ${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
  }

  return `${formatDateTime(startTime)} ~ ${formatDateTime(endTime)}`;
}

// 상대 시간 표시 (예: "3일 전")
export function getRelativeTime(dateString: string): string {
  const date = parseDate(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatDate(dateString);
}
