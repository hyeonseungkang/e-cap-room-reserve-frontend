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
import { qnaApi, ApiError } from "@/lib/api";
import type { Question, User } from "@/lib/types";

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question;
  users: User[];
  onSuccess: () => void;
}

const QUESTION_STATUSES = [
  { value: "PENDING", label: "답변 대기" },
  { value: "ANSWERED", label: "답변 완료" },
];

export function QuestionFormDialog({
  open,
  onOpenChange,
  question,
  users,
  onSuccess,
}: QuestionFormDialogProps) {
  const isEdit = !!question;

  const [formData, setFormData] = useState({
    user_id: question?.user?.user_id?.toString() || "",
    title: question?.title || "",
    content: question?.content || "",
    question_status: question?.question_status || "PENDING",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorMap: Record<string, string> = {};
    if (!isEdit && !formData.user_id) errorMap.user_id = "작성자를 선택해 주세요.";
    if (!formData.title.trim()) errorMap.title = "제목은 필수 입력 항목입니다.";
    if (!formData.content.trim()) errorMap.content = "내용은 필수 입력 항목입니다.";
    if (Object.keys(errorMap).length > 0) {
      setErrors(errorMap);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await qnaApi.updateQuestion(question.question_id, {
          title: formData.title,
          content: formData.content,
          question_status: formData.question_status,
        });
        toast.success("질문이 수정되었습니다.");
      } else {
        await qnaApi.createQuestion({
          user_id: parseInt(formData.user_id),
          title: formData.title,
          content: formData.content,
          question_status: formData.question_status,
        });
        toast.success("질문이 생성되었습니다.");
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
          <DialogTitle>{isEdit ? "질문 수정" : "질문 생성"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="user_id">작성자 *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="질문 제목"
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="질문 내용을 입력해 주세요"
              rows={5}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="question_status">상태</Label>
            <Select
              value={formData.question_status}
              onValueChange={(value) =>
                setFormData({ ...formData, question_status: value })
              }
            >
              <SelectTrigger id="question_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
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
              {isEdit ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
