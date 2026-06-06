"use client";

import { MessageSquare, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionStatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/date-utils";
import type { Question, QnaMapping, Answer } from "@/lib/types";

interface QuestionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  mappings: QnaMapping[];
  answers: Answer[];
}

export function QuestionDetailDialog({
  open,
  onOpenChange,
  question,
  mappings,
  answers,
}: QuestionDetailDialogProps) {
  // 질문 1건에 매핑된 답변이 여러 건일 수 있으므로 전체 매핑에서 모두 추출.
  // 매핑의 answer 관계에는 admin 이 없을 수 있어, 답변 목록(admin 포함)에서 보강한다.
  const mapped = question
    ? mappings
        .filter((m) => m.question?.question_id === question.question_id)
        .map((m) => {
          const answerId = m.answer?.answer_id;
          const full = answers.find((a) => a.answer_id === answerId);
          return { mapping: m, answer: full ?? m.answer ?? null };
        })
        .filter((x) => x.answer !== null)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            질문 상세
          </DialogTitle>
        </DialogHeader>

        {question && (
          <div className="space-y-5">
            {/* 질문 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{question.title}</h3>
                <QuestionStatusBadge status={question.question_status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {question.user?.name || "작성자 미상"} ·{" "}
                {formatDateTime(question.created_at)}
              </p>
              <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
                {question.content}
              </p>
            </div>

            {/* 답변 */}
            <div className="space-y-2 border-t border-border pt-4">
              <h4 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                답변 {mapped.length > 0 && `(${mapped.length})`}
              </h4>

              {mapped.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  아직 등록된 답변이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {mapped.map(({ mapping, answer }) => (
                    <div
                      key={mapping.mapping_id}
                      className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3"
                    >
                      <p className="whitespace-pre-wrap text-sm">
                        {answer!.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{answer!.answer_id} · {answer!.admin?.name || "관리자"} ·{" "}
                        {formatDateTime(answer!.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
