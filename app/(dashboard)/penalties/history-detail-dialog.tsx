"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReservationStatusBadge } from "@/components/status-badge";
import { formatDate, formatReservationPeriod } from "@/lib/date-utils";
import type { ReservationWithUser } from "@/lib/reservation-utils";
import type { PenaltyHistory, User } from "@/lib/types";

interface HistoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: PenaltyHistory;
  // /user 응답에서 매칭한 예약(회의실 포함)과 예약자 정보
  reservation?: ReservationWithUser;
  user?: User;
}

// 라벨-값 한 줄
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "-"}</span>
    </div>
  );
}

export function HistoryDetailDialog({
  open,
  onOpenChange,
  history,
  reservation,
  user,
}: HistoryDetailDialogProps) {
  const reservationId =
    reservation?.reservation_id ?? history.reservation?.reservation_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>패널티 이력 상세</DialogTitle>
          <DialogDescription>
            이 패널티와 연결된 예약 기록과 예약자 정보입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 패널티 정보 */}
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-semibold text-muted-foreground">패널티</p>
            <Field
              label="시작일"
              value={history.start_date ? formatDate(history.start_date) : "-"}
            />
            <Field
              label="종료일"
              value={history.end_date ? formatDate(history.end_date) : "-"}
            />
            <Field label="생성일" value={formatDate(history.created_at)} />
          </div>

          {/* 예약 기록 */}
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-semibold text-muted-foreground">예약 기록</p>
            {reservationId ? (
              <>
                <Field label="예약 번호" value={`#${reservationId}`} />
                <Field
                  label="회의실"
                  value={reservation?.room?.room_name ?? "-"}
                />
                {reservation && (
                  <>
                    <Field
                      label="예약 시간"
                      value={formatReservationPeriod(
                        reservation.start_time,
                        reservation.end_time
                      )}
                    />
                    <Field
                      label="목적"
                      value={reservation.purpose || "-"}
                    />
                    <Field
                      label="참석 인원"
                      value={
                        reservation.participant_count != null
                          ? `${reservation.participant_count}명`
                          : "-"
                      }
                    />
                    <Field
                      label="상태"
                      value={
                        <ReservationStatusBadge
                          status={reservation.reservation_status}
                        />
                      }
                    />
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                연결된 예약 정보가 없습니다.
              </p>
            )}
          </div>

          {/* 예약자 정보 */}
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-semibold text-muted-foreground">예약자</p>
            {user ? (
              <>
                <Field label="이름" value={user.name} />
                <Field label="이메일" value={user.email} />
                <Field label="부서" value={user.department || "-"} />
                <Field label="연락처" value={user.phone || "-"} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                예약자 정보를 찾을 수 없습니다.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
