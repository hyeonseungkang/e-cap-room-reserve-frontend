"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { ErrorPage } from "@/components/error-display";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { QuestionStatusBadge } from "@/components/status-badge";
import { QuestionFormDialog } from "./question-form-dialog";
import { QuestionDetailDialog } from "./question-detail-dialog";
import { AnswerFormDialog } from "./answer-form-dialog";
import { MappingFormDialog } from "./mapping-form-dialog";
import { formatDate } from "@/lib/date-utils";
import { fetcher, qnaApi, ApiError } from "@/lib/api";
import type { Question, Answer, QnaMapping, User, Admin } from "@/lib/types";

export default function QnaPage() {
  const {
    data: questions,
    error: questionsError,
    isLoading: questionsLoading,
    mutate: mutateQuestions,
  } = useSWR<Question[]>("/qna/questions", fetcher);
  const {
    data: answers,
    error: answersError,
    isLoading: answersLoading,
    mutate: mutateAnswers,
  } = useSWR<Answer[]>("/qna/answers", fetcher);
  const {
    data: mappings,
    error: mappingsError,
    isLoading: mappingsLoading,
    mutate: mutateMappings,
  } = useSWR<QnaMapping[]>("/qna/mappings", fetcher);
  const { data: users } = useSWR<User[]>("/user", fetcher);
  const { data: admins } = useSWR<Admin[]>("/admin", fetcher);

  // 질문
  const [isQuestionCreateOpen, setIsQuestionCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  // 답변
  const [isAnswerCreateOpen, setIsAnswerCreateOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
  const [deletingAnswer, setDeletingAnswer] = useState<Answer | null>(null);
  // 매핑
  const [isMappingCreateOpen, setIsMappingCreateOpen] = useState(false);
  const [deletingMapping, setDeletingMapping] = useState<QnaMapping | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const runDelete = async (fn: () => Promise<void>, label: string, after: () => void) => {
    setIsDeleting(true);
    try {
      await fn();
      toast.success(`${label}이(가) 삭제되었습니다.`);
      after();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (questionsLoading || answersLoading || mappingsLoading) return <LoadingPage />;
  if (questionsError || answersError || mappingsError)
    return <ErrorPage message="문의 정보를 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="문의(QnA)"
        description="질문, 답변, 질문-답변 매핑을 관리하세요."
      />

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">질문</TabsTrigger>
          <TabsTrigger value="answers">답변</TabsTrigger>
          <TabsTrigger value="mappings">매핑</TabsTrigger>
        </TabsList>

        {/* 질문 탭 */}
        <TabsContent value="questions" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsQuestionCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              질문 추가
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {!questions || questions.length === 0 ? (
                <EmptyState
                  title="등록된 질문이 없습니다"
                  description="첫 번째 질문을 추가해 보세요."
                  actionLabel="질문 추가"
                  onAction={() => setIsQuestionCreateOpen(true)}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>제목</TableHead>
                        <TableHead>작성자</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>작성일</TableHead>
                        <TableHead className="w-24 text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((q) => (
                        <TableRow key={q.question_id}>
                          <TableCell className="font-medium">
                            <button
                              type="button"
                              onClick={() => setViewingQuestion(q)}
                              className="text-left text-blue-600 hover:underline"
                            >
                              {q.title}
                            </button>
                          </TableCell>
                          <TableCell>{q.user?.name || "-"}</TableCell>
                          <TableCell>
                            <QuestionStatusBadge status={q.question_status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(q.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingQuestion(q)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeletingQuestion(q)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 답변 탭 */}
        <TabsContent value="answers" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAnswerCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              답변 추가
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {!answers || answers.length === 0 ? (
                <EmptyState
                  title="등록된 답변이 없습니다"
                  description="첫 번째 답변을 추가해 보세요."
                  actionLabel="답변 추가"
                  onAction={() => setIsAnswerCreateOpen(true)}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>내용</TableHead>
                        <TableHead>작성 관리자</TableHead>
                        <TableHead>작성일</TableHead>
                        <TableHead className="w-24 text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {answers.map((a) => (
                        <TableRow key={a.answer_id}>
                          <TableCell className="font-medium max-w-md truncate">
                            {a.content}
                          </TableCell>
                          <TableCell>{a.admin?.name || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(a.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingAnswer(a)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeletingAnswer(a)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 매핑 탭 */}
        <TabsContent value="mappings" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsMappingCreateOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              매핑 추가
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {!mappings || mappings.length === 0 ? (
                <EmptyState
                  title="등록된 매핑이 없습니다"
                  description="질문과 답변을 연결해 보세요."
                  actionLabel="매핑 추가"
                  onAction={() => setIsMappingCreateOpen(true)}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>질문</TableHead>
                        <TableHead>답변</TableHead>
                        <TableHead>연결일</TableHead>
                        <TableHead className="w-24 text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((m) => (
                        <TableRow key={m.mapping_id}>
                          <TableCell className="font-medium">
                            {m.question
                              ? `#${m.question.question_id} · ${m.question.title}`
                              : "-"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {m.answer
                              ? `#${m.answer.answer_id} · ${m.answer.content}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(m.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeletingMapping(m)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 질문 다이얼로그 */}
      <QuestionFormDialog
        open={isQuestionCreateOpen}
        onOpenChange={setIsQuestionCreateOpen}
        users={users || []}
        onSuccess={() => {
          setIsQuestionCreateOpen(false);
          mutateQuestions();
        }}
      />
      {editingQuestion && (
        <QuestionFormDialog
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          question={editingQuestion}
          users={users || []}
          onSuccess={() => {
            setEditingQuestion(null);
            mutateQuestions();
          }}
        />
      )}

      {/* 질문 상세 + 매핑된 답변 (질문당 여러 건 가능) */}
      <QuestionDetailDialog
        open={!!viewingQuestion}
        onOpenChange={(open) => !open && setViewingQuestion(null)}
        question={viewingQuestion}
        mappings={mappings || []}
        answers={answers || []}
      />

      {/* 답변 다이얼로그 */}
      <AnswerFormDialog
        open={isAnswerCreateOpen}
        onOpenChange={setIsAnswerCreateOpen}
        admins={admins || []}
        onSuccess={() => {
          setIsAnswerCreateOpen(false);
          mutateAnswers();
        }}
      />
      {editingAnswer && (
        <AnswerFormDialog
          open={!!editingAnswer}
          onOpenChange={(open) => !open && setEditingAnswer(null)}
          answer={editingAnswer}
          admins={admins || []}
          onSuccess={() => {
            setEditingAnswer(null);
            mutateAnswers();
          }}
        />
      )}

      {/* 매핑 다이얼로그 */}
      <MappingFormDialog
        open={isMappingCreateOpen}
        onOpenChange={setIsMappingCreateOpen}
        questions={questions || []}
        answers={answers || []}
        onSuccess={() => {
          setIsMappingCreateOpen(false);
          mutateMappings();
        }}
      />

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deletingQuestion}
        onOpenChange={(open) => !open && setDeletingQuestion(null)}
        title="질문 삭제"
        description={`"${deletingQuestion?.title}" 질문을 삭제하시겠습니까? 연관된 매핑도 함께 삭제됩니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={() =>
          deletingQuestion &&
          runDelete(
            () => qnaApi.deleteQuestion(deletingQuestion.question_id),
            "질문",
            () => {
              setDeletingQuestion(null);
              mutateQuestions();
              mutateMappings();
            }
          )
        }
        loading={isDeleting}
      />
      <ConfirmDialog
        open={!!deletingAnswer}
        onOpenChange={(open) => !open && setDeletingAnswer(null)}
        title="답변 삭제"
        description="이 답변을 삭제하시겠습니까? 연관된 매핑도 함께 삭제됩니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={() =>
          deletingAnswer &&
          runDelete(
            () => qnaApi.deleteAnswer(deletingAnswer.answer_id),
            "답변",
            () => {
              setDeletingAnswer(null);
              mutateAnswers();
              mutateMappings();
            }
          )
        }
        loading={isDeleting}
      />
      <ConfirmDialog
        open={!!deletingMapping}
        onOpenChange={(open) => !open && setDeletingMapping(null)}
        title="매핑 삭제"
        description="이 질문-답변 매핑을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={() =>
          deletingMapping &&
          runDelete(
            () => qnaApi.deleteMapping(deletingMapping.mapping_id),
            "매핑",
            () => {
              setDeletingMapping(null);
              mutateMappings();
            }
          )
        }
        loading={isDeleting}
      />
    </div>
  );
}
