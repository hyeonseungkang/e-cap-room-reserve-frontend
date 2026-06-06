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
import { qnaApi, ApiError } from "@/lib/api";
import type { Answer, Admin } from "@/lib/types";

interface AnswerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answer?: Answer;
  admins: Admin[];
  onSuccess: () => void;
}

export function AnswerFormDialog({
  open,
  onOpenChange,
  answer,
  admins,
  onSuccess,
}: AnswerFormDialogProps) {
  const isEdit = !!answer;

  const [formData, setFormData] = useState({
    admin_id: answer?.admin?.admin_id?.toString() || "",
    content: answer?.content || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorMap: Record<string, string> = {};
    if (!isEdit && !formData.admin_id)
      errorMap.admin_id = "답변 관리자를 선택해 주세요.";
    if (!formData.content.trim()) errorMap.content = "내용은 필수 입력 항목입니다.";
    if (Object.keys(errorMap).length > 0) {
      setErrors(errorMap);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await qnaApi.updateAnswer(answer.answer_id, {
          content: formData.content,
        });
        toast.success("답변이 수정되었습니다.");
      } else {
        await qnaApi.createAnswer({
          admin_id: parseInt(formData.admin_id),
          content: formData.content,
        });
        toast.success("답변이 생성되었습니다.");
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
          <DialogTitle>{isEdit ? "답변 수정" : "답변 생성"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="admin_id">답변 관리자 *</Label>
              <Select
                value={formData.admin_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, admin_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="관리자 선택" />
                </SelectTrigger>
                <SelectContent>
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
              {errors.admin_id && (
                <p className="text-sm text-destructive">{errors.admin_id}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="답변 내용을 입력해 주세요"
              rows={5}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
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
              {isEdit ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
