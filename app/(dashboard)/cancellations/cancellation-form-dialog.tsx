"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cancellationLogApi, ApiError } from "@/lib/api";
import { reservationLabel, type ReservationWithUser } from "@/lib/reservation-utils";
import type { CancellationLog } from "@/lib/types";

interface CancellationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log?: CancellationLog;
  reservations: ReservationWithUser[];
  onSuccess: () => void;
}

export function CancellationFormDialog({
  open,
  onOpenChange,
  log,
  reservations,
  onSuccess,
}: CancellationFormDialogProps) {
  const isEdit = !!log;

  const [formData, setFormData] = useState({
    reservation_id: log?.reservation?.reservation_id?.toString() || "",
    cancel_reason: log?.cancel_reason || "",
    is_late_cancel: log ? log.is_late_cancel : 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && !formData.reservation_id) {
      setErrors({ reservation_id: "예약을 선택해 주세요." });
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await cancellationLogApi.update(log.cancellation_id, {
          cancel_reason: formData.cancel_reason || undefined,
          is_late_cancel: formData.is_late_cancel,
        });
        toast.success("취소 기록이 수정되었습니다.");
      } else {
        await cancellationLogApi.create({
          reservation_id: parseInt(formData.reservation_id),
          cancel_reason: formData.cancel_reason || undefined,
          is_late_cancel: formData.is_late_cancel,
        });
        toast.success("취소 기록이 생성되었습니다.");
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "취소 기록 수정" : "취소 기록 생성"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="reservation_id">예약 *</Label>
              <Select
                value={formData.reservation_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, reservation_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="예약 선택" />
                </SelectTrigger>
                <SelectContent>
                  {reservations.length === 0 ? (
                    <SelectItem disabled value="none">
                      예약이 없습니다
                    </SelectItem>
                  ) : (
                    reservations.map((res) => (
                      <SelectItem
                        key={res.reservation_id}
                        value={res.reservation_id.toString()}
                      >
                        {reservationLabel(res)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.reservation_id && (
                <p className="text-sm text-destructive">{errors.reservation_id}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cancel_reason">취소 사유</Label>
            <Textarea
              id="cancel_reason"
              value={formData.cancel_reason}
              onChange={(e) =>
                setFormData({ ...formData, cancel_reason: e.target.value })
              }
              placeholder="취소 사유를 입력해 주세요"
              maxLength={255}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_late_cancel">긴급(당일) 취소 여부</Label>
            <Select
              value={formData.is_late_cancel.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, is_late_cancel: parseInt(value) })
              }
            >
              <SelectTrigger id="is_late_cancel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">일반 취소</SelectItem>
                <SelectItem value="1">긴급 취소</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2" />}
              {isEdit ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
