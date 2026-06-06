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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { usageLogApi, ApiError } from "@/lib/api";
import {
  toDateTimeLocalString,
  fromDateTimeLocalString,
  toISOString,
} from "@/lib/date-utils";
import { reservationLabel, type ReservationWithUser } from "@/lib/reservation-utils";
import type { UsageLog } from "@/lib/types";

interface UsageLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageLog?: UsageLog;
  reservations: ReservationWithUser[];
  onSuccess: () => void;
}

export function UsageLogFormDialog({
  open,
  onOpenChange,
  usageLog,
  reservations,
  onSuccess,
}: UsageLogFormDialogProps) {
  const isEdit = !!usageLog;

  const [formData, setFormData] = useState({
    reservation_id: usageLog?.reservation?.reservation_id?.toString() || "",
    check_in_time: usageLog?.check_in_time
      ? toDateTimeLocalString(new Date(usageLog.check_in_time))
      : "",
    check_out_time: usageLog?.check_out_time
      ? toDateTimeLocalString(new Date(usageLog.check_out_time))
      : "",
    usage_status: usageLog?.usage_status || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 예약 선택 → 체크인 시간을 예약 시작시각으로 기본 설정
  const handleReservationChange = (value: string) => {
    const res = reservations.find(
      (r) => r.reservation_id.toString() === value
    );
    const checkIn = res ? toDateTimeLocalString(new Date(res.start_time)) : "";
    setFormData((prev) => ({
      ...prev,
      reservation_id: value,
      check_in_time: checkIn || prev.check_in_time,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && !formData.reservation_id) {
      setErrors({ reservation_id: "예약을 선택해 주세요." });
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const checkIn = formData.check_in_time
      ? toISOString(fromDateTimeLocalString(formData.check_in_time))
      : undefined;
    const checkOut = formData.check_out_time
      ? toISOString(fromDateTimeLocalString(formData.check_out_time))
      : undefined;

    try {
      if (isEdit) {
        await usageLogApi.update(usageLog.usage_id, {
          check_in_time: checkIn,
          check_out_time: checkOut,
          usage_status: formData.usage_status || undefined,
        });
        toast.success("이용 기록이 수정되었습니다.");
      } else {
        await usageLogApi.create({
          reservation_id: parseInt(formData.reservation_id),
          check_in_time: checkIn,
          check_out_time: checkOut,
          usage_status: formData.usage_status || undefined,
        });
        toast.success("이용 기록이 생성되었습니다.");
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 500) {
          toast.error("이미 해당 예약의 이용 기록이 존재합니다.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "이용 기록 수정" : "이용 기록 생성"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="reservation_id">예약 *</Label>
              <Select
                value={formData.reservation_id}
                onValueChange={handleReservationChange}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in_time">체크인 시간</Label>
              <Input
                id="check_in_time"
                type="datetime-local"
                value={formData.check_in_time}
                onChange={(e) =>
                  setFormData({ ...formData, check_in_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_time">체크아웃 시간</Label>
              <Input
                id="check_out_time"
                type="datetime-local"
                value={formData.check_out_time}
                onChange={(e) =>
                  setFormData({ ...formData, check_out_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage_status">이용 상태</Label>
            <Input
              id="usage_status"
              value={formData.usage_status}
              onChange={(e) =>
                setFormData({ ...formData, usage_status: e.target.value })
              }
              placeholder="예: 이용중, 완료, 노쇼"
              maxLength={20}
            />
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
