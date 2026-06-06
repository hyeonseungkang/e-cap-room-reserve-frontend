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
import { penaltyApi, ApiError } from "@/lib/api";
import {
  toDateTimeLocalString,
  fromDateTimeLocalString,
  toISOString,
} from "@/lib/date-utils";
import { reservationLabel, type ReservationWithUser } from "@/lib/reservation-utils";
import type { PenaltyHistory, PenaltyPolicy } from "@/lib/types";

interface HistoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history?: PenaltyHistory;
  reservations: ReservationWithUser[];
  policies: PenaltyPolicy[];
  onSuccess: () => void;
}

// datetime-local 문자열에 일수를 더한 datetime-local 문자열 반환
function addDaysToLocal(local: string, days: number): string {
  if (!local) return "";
  const d = fromDateTimeLocalString(local);
  d.setDate(d.getDate() + days);
  return toDateTimeLocalString(d);
}

export function HistoryFormDialog({
  open,
  onOpenChange,
  history,
  reservations,
  policies,
  onSuccess,
}: HistoryFormDialogProps) {
  const isEdit = !!history;

  const [formData, setFormData] = useState({
    reservation_id: history?.reservation?.reservation_id?.toString() || "",
    policy_id: "",
    start_date: history?.start_date
      ? toDateTimeLocalString(new Date(history.start_date))
      : "",
    end_date: history?.end_date
      ? toDateTimeLocalString(new Date(history.end_date))
      : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 시작일 + 선택된 정책의 제한 일수 → 종료일 계산
  const computeEndDate = (start: string, policyId: string): string => {
    const policy = policies.find(
      (p) => p.penalty_policy_id.toString() === policyId
    );
    if (!start || !policy || policy.restriction_days == null) return "";
    return addDaysToLocal(start, policy.restriction_days);
  };

  // 예약 선택 → 시작일을 예약 종료시각으로 설정하고, 정책이 있으면 종료일 재계산
  const handleReservationChange = (value: string) => {
    const res = reservations.find(
      (r) => r.reservation_id.toString() === value
    );
    const start = res ? toDateTimeLocalString(new Date(res.end_time)) : "";
    setFormData((prev) => ({
      ...prev,
      reservation_id: value,
      start_date: start || prev.start_date,
      end_date: computeEndDate(start || prev.start_date, prev.policy_id),
    }));
  };

  // 정책 선택 → 종료일 = 시작일 + 정책 일수
  const handlePolicyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      policy_id: value,
      end_date: computeEndDate(prev.start_date, value) || prev.end_date,
    }));
  };

  // 시작일 수정 → 정책 선택돼 있으면 종료일 재계산
  const handleStartDateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      start_date: value,
      end_date: prev.policy_id
        ? computeEndDate(value, prev.policy_id) || prev.end_date
        : prev.end_date,
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

    const startDate = formData.start_date
      ? toISOString(fromDateTimeLocalString(formData.start_date))
      : undefined;
    const endDate = formData.end_date
      ? toISOString(fromDateTimeLocalString(formData.end_date))
      : undefined;

    try {
      if (isEdit) {
        await penaltyApi.updateHistory(history.penalty_history_id, {
          start_date: startDate,
          end_date: endDate,
        });
        toast.success("패널티 이력이 수정되었습니다.");
      } else {
        await penaltyApi.createHistory({
          reservation_id: parseInt(formData.reservation_id),
          start_date: startDate,
          end_date: endDate,
        });
        toast.success("패널티 이력이 생성되었습니다.");
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
          <DialogTitle>
            {isEdit ? "패널티 이력 수정" : "패널티 이력 생성"}
          </DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="policy_id">패널티 정책</Label>
            <Select value={formData.policy_id} onValueChange={handlePolicyChange}>
              <SelectTrigger id="policy_id">
                <SelectValue placeholder="정책 선택 (종료일 자동 계산)" />
              </SelectTrigger>
              <SelectContent>
                {policies.length === 0 ? (
                  <SelectItem disabled value="none">
                    등록된 정책이 없습니다
                  </SelectItem>
                ) : (
                  policies.map((p) => (
                    <SelectItem
                      key={p.penalty_policy_id}
                      value={p.penalty_policy_id.toString()}
                    >
                      {p.penalty_type}
                      {p.restriction_days != null
                        ? ` (${p.restriction_days}일)`
                        : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              정책을 선택하면 종료일이 시작일 + 제한 일수로 자동 설정됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">시작일</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">종료일</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
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
