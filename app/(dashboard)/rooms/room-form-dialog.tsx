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
import { validateMeetingRoom } from "@/lib/validation";
import { meetingRoomApi, ApiError } from "@/lib/api";
import type { MeetingRoom, Admin, CreateMeetingRoomDto, UpdateMeetingRoomDto } from "@/lib/types";

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: MeetingRoom;
  admins: Admin[];
  onSuccess: () => void;
}

const ROOM_STATUSES = [
  { value: "AVAILABLE", label: "사용 가능" },
  { value: "MAINTENANCE", label: "점검 중" },
  { value: "UNAVAILABLE", label: "사용 불가" },
];

export function RoomFormDialog({
  open,
  onOpenChange,
  room,
  admins,
  onSuccess,
}: RoomFormDialogProps) {
  const isEdit = !!room;

  const [formData, setFormData] = useState({
    room_name: room?.room_name || "",
    location: room?.location || "",
    capacity: room?.capacity?.toString() || "",
    room_status: room?.room_status || "AVAILABLE",
    admin_id: room?.admin?.admin_id?.toString() || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      room_name: formData.room_name,
      location: formData.location,
      capacity: parseInt(formData.capacity) || 0,
      room_status: formData.room_status,
    };

    const validationErrors = validateMeetingRoom(data, !isEdit);
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
        const updateData: UpdateMeetingRoomDto = {
          ...data,
          admin_id: formData.admin_id ? parseInt(formData.admin_id) : null,
        };
        await meetingRoomApi.update(room.room_id, updateData);
        toast.success("회의실이 수정되었습니다.");
      } else {
        const createData: CreateMeetingRoomDto = {
          ...data,
          admin_id: formData.admin_id ? parseInt(formData.admin_id) : undefined,
        };
        await meetingRoomApi.create(createData);
        toast.success("회의실이 추가되었습니다.");
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
          <DialogTitle>{isEdit ? "회의실 수정" : "회의실 추가"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room_name">회의실 이름 *</Label>
            <Input
              id="room_name"
              value={formData.room_name}
              onChange={(e) =>
                setFormData({ ...formData, room_name: e.target.value })
              }
              placeholder="예: 대회의실 A"
              maxLength={100}
            />
            {errors.room_name && (
              <p className="text-sm text-destructive">{errors.room_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">위치 *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="예: 본관 3층"
              maxLength={100}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">수용 인원 *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              placeholder="예: 10"
            />
            {errors.capacity && (
              <p className="text-sm text-destructive">{errors.capacity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_status">상태</Label>
            <Select
              value={formData.room_status}
              onValueChange={(value) =>
                setFormData({ ...formData, room_status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_id">담당 관리자</Label>
            <Select
              value={formData.admin_id}
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
                  <SelectItem key={admin.admin_id} value={admin.admin_id.toString()}>
                    {admin.name} ({admin.department || "부서 없음"})
                  </SelectItem>
                ))}
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
              {isEdit ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
