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
import { Spinner } from "@/components/ui/spinner";
import { validateEquipment } from "@/lib/validation";
import { equipmentApi, ApiError } from "@/lib/api";
import type { RoomEquipment } from "@/lib/types";

interface EquipmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  equipment?: RoomEquipment;
  onSuccess: () => void;
}

export function EquipmentFormDialog({
  open,
  onOpenChange,
  roomId,
  equipment,
  onSuccess,
}: EquipmentFormDialogProps) {
  const isEdit = !!equipment;

  const [formData, setFormData] = useState({
    equipment_name: equipment?.equipment_name || "",
    quantity: equipment?.quantity?.toString() || "1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      equipment_name: formData.equipment_name,
      quantity: parseInt(formData.quantity) || 1,
    };

    const validationErrors = validateEquipment(data, !isEdit);
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
        await equipmentApi.update(roomId, equipment.equipment_id, data);
        toast.success("장비가 수정되었습니다.");
      } else {
        await equipmentApi.create(roomId, data);
        toast.success("장비가 추가되었습니다.");
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "장비 수정" : "장비 추가"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipment_name">장비 이름 *</Label>
            <Input
              id="equipment_name"
              value={formData.equipment_name}
              onChange={(e) =>
                setFormData({ ...formData, equipment_name: e.target.value })
              }
              placeholder="예: 프로젝터"
              maxLength={100}
            />
            {errors.equipment_name && (
              <p className="text-sm text-destructive">{errors.equipment_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">수량</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity}</p>
            )}
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
              {isEdit ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
