"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { reservationApi, cancellationLogApi, ApiError } from "@/lib/api";
import { formatReservationPeriod } from "@/lib/date-utils";
import type { Reservation } from "@/lib/types";

// 취소 시 저장할 예약 상태값
export const CANCELED_STATUS = "CANCELED";

interface CancelReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation;
  onSuccess: () => void;
}

// 예약 시작이 현재 시간 전이면 is_late_cancel 1
function isCancelLated(startTime: string): boolean {
  const start = new Date(startTime);
  const now = new Date();
  return start <= now;
}

export function CancelReservationDialog({
  open,
  onOpenChange,
  reservation,
  onSuccess,
}: CancelReservationDialogProps) {
  const [cancelReason, setCancelReason] = useState("");
  const [isLateCancel, setIsLateCancel] = useState(
    isCancelLated(reservation.start_time) ? 1 : 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // 1) 예약 상태를 취소로 변경
      await reservationApi.update(reservation.reservation_id, {
        reservation_status: CANCELED_STATUS,
      });
      // 2) 취소 기록 추가
      await cancellationLogApi.create({
        reservation_id: reservation.reservation_id,
        cancel_reason: cancelReason || undefined,
        is_late_cancel: isLateCancel,
      });
      toast.success("예약이 취소되었고 취소 기록이 추가되었습니다.");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("예약 취소 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>예약 취소</DialogTitle>
          <DialogDescription>
            이 예약을 취소하고 취소 기록에 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">
              {reservation.room?.room_name || "회의실"}
            </p>
            <p className="text-muted-foreground">
              {formatReservationPeriod(
                reservation.start_time,
                reservation.end_time
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel_reason">취소 사유</Label>
            <Textarea
              id="cancel_reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="취소 사유를 입력해 주세요 (선택)"
              maxLength={255}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_late_cancel">취소 구분</Label>
            <Select
              value={isLateCancel.toString()}
              onValueChange={(value) => setIsLateCancel(parseInt(value))}
            >
              <SelectTrigger id="is_late_cancel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem disabled={isLateCancel.toString() === "1"} value="0">일반 취소</SelectItem>
                <SelectItem disabled={isLateCancel.toString() === "0"} value="1">지연 취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            닫기
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner className="mr-2" />}
            예약 취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
