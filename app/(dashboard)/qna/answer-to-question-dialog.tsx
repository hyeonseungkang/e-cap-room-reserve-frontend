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
import { QuestionStatusBadge } from "@/components/status-badge";
import { qnaApi, ApiError } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import type { Question, Admin } from "@/lib/types";

interface AnswerToQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question;
  admins: Admin[];
  onSuccess: () => void;
}

export function AnswerToQuestionDialog({
  open,
  onOpenChange,
  question,
  admins,
  onSuccess,
}: AnswerToQuestionDialogProps) {
  const { session } = useSession();

  const [adminId, setAdminId] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인한 관리자가 있으면 기본 선택
  const effectiveAdminId =
    adminId || (session?.type === "admin" ? String(session.id) : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorMap: Record<string, string> = {};
    if (!effectiveAdminId) errorMap.admin_id = "답변 관리자를 선택해 주세요.";
    if (!content.trim()) errorMap.content = "답변 내용을 입력해 주세요.";
    if (Object.keys(errorMap).length > 0) {
      setErrors(errorMap);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      // 1) 답변 생성 → 2) 질문-답변 매핑 → 3) 질문 상태 ANSWERED
      const answer = await qnaApi.createAnswer({
        admin_id: parseInt(effectiveAdminId),
        content,
      });
      await qnaApi.createMapping({
        question_id: question.question_id,
        answer_id: answer.answer_id,
      });
      if (question.question_status !== "ANSWERED") {
        await qnaApi.updateQuestion(question.question_id, {
          question_status: "ANSWERED",
        });
      }
      toast.success("답변이 등록되었습니다.");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 500) {
          toast.error("답변 등록 중 제약 조건 오류가 발생했습니다.");
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>답변 작성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 대상 질문 */}
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{question.title}</p>
              <QuestionStatusBadge status={question.question_status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {question.user?.name || "작성자 미상"}
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground/80">
              {question.content}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_id">답변 관리자 *</Label>
            <Select
              value={effectiveAdminId}
              onValueChange={(value) => setAdminId(value)}
            >
              <SelectTrigger id="admin_id">
                <SelectValue placeholder="관리자 선택" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.admin_id} value={admin.admin_id.toString()}>
                    {admin.name} ({admin.department || "부서 없음"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.admin_id && (
              <p className="text-sm text-destructive">{errors.admin_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">답변 내용 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
              답변 등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
