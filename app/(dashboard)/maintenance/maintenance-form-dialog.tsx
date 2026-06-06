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
import { maintenanceApi, ApiError } from "@/lib/api";
import type { RoomMaintenanceLog, MeetingRoom, Admin } from "@/lib/types";

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log?: RoomMaintenanceLog;
  rooms: MeetingRoom[];
  admins: Admin[];
  onSuccess: () => void;
}

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  log,
  rooms,
  admins,
  onSuccess,
}: MaintenanceFormDialogProps) {
  const isEdit = !!log;

  const [formData, setFormData] = useState({
    room_id: log?.room?.room_id?.toString() || "",
    admin_id: log?.admin?.admin_id?.toString() || "",
    maintenance_type: log?.maintenance_type || "",
    maintenance_status: log?.maintenance_status || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && !formData.room_id) {
      setErrors({ room_id: "회의실을 선택해 주세요." });
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const adminId =
      formData.admin_id && formData.admin_id !== "null"
        ? parseInt(formData.admin_id)
        : null;

    try {
      if (isEdit) {
        await maintenanceApi.update(log.maintenance_id, {
          admin_id: adminId,
          maintenance_type: formData.maintenance_type || undefined,
          maintenance_status: formData.maintenance_status || undefined,
        });
        toast.success("유지보수 로그가 수정되었습니다.");
      } else {
        await maintenanceApi.create({
          room_id: parseInt(formData.room_id),
          admin_id: adminId ?? undefined,
          maintenance_type: formData.maintenance_type || undefined,
          maintenance_status: formData.maintenance_status || undefined,
        });
        toast.success("유지보수 로그가 생성되었습니다.");
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
            {isEdit ? "유지보수 로그 수정" : "유지보수 로그 생성"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  {rooms.length === 0 ? (
                    <SelectItem disabled value="none">
                      회의실이 없습니다
                    </SelectItem>
                  ) : (
                    rooms.map((room) => (
                      <SelectItem
                        key={room.room_id}
                        value={room.room_id.toString()}
                      >
                        {room.room_name} ({room.location})
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

          <div className="space-y-2">
            <Label htmlFor="admin_id">담당 관리자</Label>
            <Select
              value={formData.admin_id || "null"}
              onValueChange={(value) =>
                setFormData({ ...formData, admin_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="관리자 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">없음</SelectItem>
                {admins.map((admin) => (
                  <SelectItem
                    key={admin.admin_id}
                    value={admin.admin_id.toString()}
                  >
                    {admin.name} ({admin.department || "부서 없음"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_type">유지보수 유형</Label>
            <Input
              id="maintenance_type"
              value={formData.maintenance_type}
              onChange={(e) =>
                setFormData({ ...formData, maintenance_type: e.target.value })
              }
              placeholder="예: 정기 청소, 프로젝터 교체"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_status">진행 상태</Label>
            <Input
              id="maintenance_status"
              value={formData.maintenance_status}
              onChange={(e) =>
                setFormData({ ...formData, maintenance_status: e.target.value })
              }
              placeholder="예: 진행중, 완료"
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
