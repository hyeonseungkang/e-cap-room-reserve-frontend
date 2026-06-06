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
import { Spinner } from "@/components/ui/spinner";
import { penaltyApi, ApiError } from "@/lib/api";
import type { PenaltyPolicy } from "@/lib/types";

interface PolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: PenaltyPolicy;
  onSuccess: () => void;
}

export function PolicyFormDialog({
  open,
  onOpenChange,
  policy,
  onSuccess,
}: PolicyFormDialogProps) {
  const isEdit = !!policy;

  const [formData, setFormData] = useState({
    penalty_type: policy?.penalty_type || "",
    penalty_reason: policy?.penalty_reason || "",
    restriction_days: policy?.restriction_days?.toString() || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.penalty_type.trim()) {
      setErrors({ penalty_type: "패널티 유형은 필수 입력 항목입니다." });
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const restrictionDays = formData.restriction_days
      ? parseInt(formData.restriction_days)
      : undefined;

    try {
      if (isEdit) {
        await penaltyApi.updatePolicy(policy.penalty_policy_id, {
          penalty_type: formData.penalty_type,
          penalty_reason: formData.penalty_reason || undefined,
          restriction_days: restrictionDays,
        });
        toast.success("패널티 정책이 수정되었습니다.");
      } else {
        await penaltyApi.createPolicy({
          penalty_type: formData.penalty_type,
          penalty_reason: formData.penalty_reason || undefined,
          restriction_days: restrictionDays,
        });
        toast.success("패널티 정책이 생성되었습니다.");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "패널티 정책 수정" : "패널티 정책 생성"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="penalty_type">패널티 유형 *</Label>
            <Input
              id="penalty_type"
              value={formData.penalty_type}
              onChange={(e) =>
                setFormData({ ...formData, penalty_type: e.target.value })
              }
              placeholder="예: 당일 긴급 취소, 노쇼"
              maxLength={50}
            />
            {errors.penalty_type && (
              <p className="text-sm text-destructive">{errors.penalty_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="penalty_reason">패널티 사유</Label>
            <Textarea
              id="penalty_reason"
              value={formData.penalty_reason}
              onChange={(e) =>
                setFormData({ ...formData, penalty_reason: e.target.value })
              }
              placeholder="패널티 적용 사유"
              maxLength={255}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restriction_days">제한 일수</Label>
            <Input
              id="restriction_days"
              type="number"
              min="0"
              value={formData.restriction_days}
              onChange={(e) =>
                setFormData({ ...formData, restriction_days: e.target.value })
              }
              placeholder="예: 3"
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
