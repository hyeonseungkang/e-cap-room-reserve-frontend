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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { qnaApi, ApiError } from "@/lib/api";
import type { Question, Answer } from "@/lib/types";

interface MappingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  answers: Answer[];
  onSuccess: () => void;
}

export function MappingFormDialog({
  open,
  onOpenChange,
  questions,
  answers,
  onSuccess,
}: MappingFormDialogProps) {
  const [formData, setFormData] = useState({
    question_id: "",
    answer_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorMap: Record<string, string> = {};
    if (!formData.question_id) errorMap.question_id = "질문을 선택해 주세요.";
    if (!formData.answer_id) errorMap.answer_id = "답변을 선택해 주세요.";
    if (Object.keys(errorMap).length > 0) {
      setErrors(errorMap);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      await qnaApi.createMapping({
        question_id: parseInt(formData.question_id),
        answer_id: parseInt(formData.answer_id),
      });
      toast.success("질문-답변 매핑이 생성되었습니다.");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 500) {
          toast.error("이미 매핑된 질문 또는 답변입니다.");
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
          <DialogTitle>질문-답변 매핑 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_id">질문 *</Label>
            <Select
              value={formData.question_id}
              onValueChange={(value) =>
                setFormData({ ...formData, question_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="질문 선택" />
              </SelectTrigger>
              <SelectContent>
                {questions.length === 0 ? (
                  <SelectItem disabled value="none">
                    질문이 없습니다
                  </SelectItem>
                ) : (
                  questions.map((q) => (
                    <SelectItem
                      key={q.question_id}
                      value={q.question_id.toString()}
                    >
                      #{q.question_id} · {q.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.question_id && (
              <p className="text-sm text-destructive">{errors.question_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer_id">답변 *</Label>
            <Select
              value={formData.answer_id}
              onValueChange={(value) =>
                setFormData({ ...formData, answer_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="답변 선택" />
              </SelectTrigger>
              <SelectContent>
                {answers.length === 0 ? (
                  <SelectItem disabled value="none">
                    답변이 없습니다
                  </SelectItem>
                ) : (
                  answers.map((a) => (
                    <SelectItem key={a.answer_id} value={a.answer_id.toString()}>
                      #{a.answer_id} · {a.content.slice(0, 30)}
                      {a.content.length > 30 ? "…" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.answer_id && (
              <p className="text-sm text-destructive">{errors.answer_id}</p>
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
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
