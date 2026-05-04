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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { validateReservation } from "@/lib/validation";
import { toDateTimeLocalString, fromDateTimeLocalString, toISOString } from "@/lib/date-utils";
import { reservationApi, ApiError } from "@/lib/api";
import type { User, MeetingRoom, Reservation } from "@/lib/types";

interface ReservationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation;
  userId?: number;
  users: User[];
  rooms: MeetingRoom[];
  onSuccess: () => void;
}

const RESERVATION_STATUSES = [
  { value: "RESERVED", label: "예약됨" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소됨" },
];

export function ReservationFormDialog({
  open,
  onOpenChange,
  reservation,
  userId,
  users,
  rooms,
  onSuccess,
}: ReservationFormDialogProps) {
  const isEdit = !!reservation;

  // 기본 시간 설정 (현재 시간 기준 1시간 뒤 ~ 2시간 뒤)
  const defaultStartTime = new Date();
  defaultStartTime.setHours(defaultStartTime.getHours() + 1, 0, 0, 0);
  const defaultEndTime = new Date(defaultStartTime);
  defaultEndTime.setHours(defaultEndTime.getHours() + 1);

  const [formData, setFormData] = useState({
    user_id: userId?.toString() || "",
    room_id: reservation?.room?.room_id?.toString() || "",
    start_time: reservation
      ? toDateTimeLocalString(new Date(reservation.start_time))
      : toDateTimeLocalString(defaultStartTime),
    end_time: reservation
      ? toDateTimeLocalString(new Date(reservation.end_time))
      : toDateTimeLocalString(defaultEndTime),
    purpose: reservation?.purpose || "",
    reservation_status: reservation?.reservation_status || "RESERVED",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startTime = toISOString(fromDateTimeLocalString(formData.start_time));
    const endTime = toISOString(fromDateTimeLocalString(formData.end_time));

    const data = {
      start_time: startTime,
      end_time: endTime,
      room_id: parseInt(formData.room_id) || 0,
      purpose: formData.purpose || undefined,
    };

    const validationErrors = validateReservation(data, !isEdit);

    // 생성 시 사용자 선택 필수
    if (!isEdit && !formData.user_id) {
      validationErrors.push({ field: "user_id", message: "사용자를 선택해 주세요." });
    }

    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await reservationApi.update(reservation.reservation_id, {
          start_time: startTime,
          end_time: endTime,
          purpose: formData.purpose || undefined,
          reservation_status: formData.reservation_status,
        });
        toast.success("예약이 수정되었습니다.");
      } else {
        await reservationApi.create(parseInt(formData.user_id), {
          start_time: startTime,
          end_time: endTime,
          room_id: parseInt(formData.room_id),
          purpose: formData.purpose || undefined,
        });
        toast.success("예약이 생성되었습니다.");
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        // 500 에러 (DB CHECK 제약 위반)
        if (err.statusCode === 500) {
          toast.error("예약 시간을 확인해 주세요. 종료 시간은 시작 시간 이후여야 합니다.");
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

  const availableRooms = rooms.filter((r) => r.room_status === "AVAILABLE");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "예약 수정" : "새 예약"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="user_id">예약자 *</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, user_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="사용자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="text-sm text-destructive">{errors.user_id}</p>
              )}
            </div>
          )}

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="room_id">회의실 *</Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, room_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="회의실 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.length === 0 ? (
                    <SelectItem disabled value={"null"}>
                      사용 가능한 회의실이 없습니다
                    </SelectItem>
                  ) : (
                    availableRooms.map((room) => (
                      <SelectItem key={room.room_id} value={room.room_id.toString()}>
                        {room.room_name} ({room.location}, {room.capacity}명)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.room_id && (
                <p className="text-sm text-destructive">{errors.room_id}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">시작 시간 *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
              />
              {errors.start_time && (
                <p className="text-sm text-destructive">{errors.start_time}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">종료 시간 *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
              />
              {errors.end_time && (
                <p className="text-sm text-destructive">{errors.end_time}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">목적</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              placeholder="회의 목적을 입력해 주세요"
              maxLength={255}
              rows={3}
            />
            {errors.purpose && (
              <p className="text-sm text-destructive">{errors.purpose}</p>
            )}
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="reservation_status">상태</Label>
              <Select
                value={formData.reservation_status}
                onValueChange={(value) =>
                  setFormData({ ...formData, reservation_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESERVATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              {isEdit ? "수정" : "예약"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
