"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { PolicyFormDialog } from "./policy-form-dialog";
import { HistoryFormDialog } from "./history-form-dialog";
import { formatDate } from "@/lib/date-utils";
import { flattenReservations } from "@/lib/reservation-utils";
import { fetcher, penaltyApi, ApiError } from "@/lib/api";
import type { PenaltyPolicy, PenaltyHistory, User } from "@/lib/types";

export default function PenaltiesPage() {
  const {
    data: policies,
    error: policiesError,
    isLoading: policiesLoading,
    mutate: mutatePolicies,
  } = useSWR<PenaltyPolicy[]>("/penalty/policies", fetcher);
  const {
    data: histories,
    error: historiesError,
    isLoading: historiesLoading,
    mutate: mutateHistories,
  } = useSWR<PenaltyHistory[]>("/penalty/history", fetcher);
  const { data: users } = useSWR<User[]>("/user", fetcher);
  const reservations = flattenReservations(users);

  // 정책 상태
  const [isPolicyCreateOpen, setIsPolicyCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PenaltyPolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<PenaltyPolicy | null>(null);

  // 이력 상태
  const [isHistoryCreateOpen, setIsHistoryCreateOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<PenaltyHistory | null>(null);
  const [deletingHistory, setDeletingHistory] = useState<PenaltyHistory | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePolicy = async () => {
    if (!deletingPolicy) return;
    setIsDeleting(true);
    try {
      await penaltyApi.deletePolicy(deletingPolicy.penalty_policy_id);
      toast.success("패널티 정책이 삭제되었습니다.");
      mutatePolicies();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setDeletingPolicy(null);
    }
  };

  const handleDeleteHistory = async () => {
    if (!deletingHistory) return;
    setIsDeleting(true);
    try {
      await penaltyApi.deleteHistory(deletingHistory.penalty_history_id);
      toast.success("패널티 이력이 삭제되었습니다.");
      mutateHistories();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setDeletingHistory(null);
    }
  };

  if (policiesLoading || historiesLoading) return <LoadingPage />;
  if (policiesError || historiesError)
    return <ErrorPage message="패널티 정보를 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="패널티"
        description="패널티 정책과 사용자 패널티 이력을 관리하세요."
      />

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">패널티 정책</TabsTrigger>
          <TabsTrigger value="history">패널티 이력</TabsTrigger>
        </TabsList>

        {/* 정책 탭 */}
        <TabsContent value="policies" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsPolicyCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              정책 추가
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {!policies || policies.length === 0 ? (
                <EmptyState
                  title="등록된 패널티 정책이 없습니다"
                  description="첫 번째 패널티 정책을 추가해 보세요."
                  actionLabel="정책 추가"
                  onAction={() => setIsPolicyCreateOpen(true)}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>패널티 유형</TableHead>
                        <TableHead>사유</TableHead>
                        <TableHead className="text-center">제한 일수</TableHead>
                        <TableHead>생성일</TableHead>
                        <TableHead className="w-24 text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.map((policy) => (
                        <TableRow key={policy.penalty_policy_id}>
                          <TableCell className="font-medium">
                            {policy.penalty_type}
                          </TableCell>
                          <TableCell>{policy.penalty_reason || "-"}</TableCell>
                          <TableCell className="text-center">
                            {policy.restriction_days != null
                              ? `${policy.restriction_days}일`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(policy.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingPolicy(policy)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeletingPolicy(policy)}
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

        {/* 이력 탭 */}
        <TabsContent value="history" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsHistoryCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              이력 추가
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {!histories || histories.length === 0 ? (
                <EmptyState
                  title="패널티 이력이 없습니다"
                  description="첫 번째 패널티 이력을 추가해 보세요."
                  actionLabel="이력 추가"
                  onAction={() => setIsHistoryCreateOpen(true)}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>예약</TableHead>
                        <TableHead>시작일</TableHead>
                        <TableHead>종료일</TableHead>
                        <TableHead>생성일</TableHead>
                        <TableHead className="w-24 text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {histories.map((history) => (
                        <TableRow key={history.penalty_history_id}>
                          <TableCell className="font-medium">
                            {history.reservation
                              ? `#${history.reservation.reservation_id}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {history.start_date
                              ? formatDate(history.start_date)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {history.end_date ? formatDate(history.end_date) : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(history.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingHistory(history)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeletingHistory(history)}
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
      </Tabs>

      {/* 정책 다이얼로그 */}
      <PolicyFormDialog
        open={isPolicyCreateOpen}
        onOpenChange={setIsPolicyCreateOpen}
        onSuccess={() => {
          setIsPolicyCreateOpen(false);
          mutatePolicies();
        }}
      />
      {editingPolicy && (
        <PolicyFormDialog
          open={!!editingPolicy}
          onOpenChange={(open) => !open && setEditingPolicy(null)}
          policy={editingPolicy}
          onSuccess={() => {
            setEditingPolicy(null);
            mutatePolicies();
          }}
        />
      )}

      {/* 이력 다이얼로그 */}
      <HistoryFormDialog
        open={isHistoryCreateOpen}
        onOpenChange={setIsHistoryCreateOpen}
        reservations={reservations}
        policies={policies || []}
        onSuccess={() => {
          setIsHistoryCreateOpen(false);
          mutateHistories();
        }}
      />
      {editingHistory && (
        <HistoryFormDialog
          open={!!editingHistory}
          onOpenChange={(open) => !open && setEditingHistory(null)}
          history={editingHistory}
          reservations={reservations}
          policies={policies || []}
          onSuccess={() => {
            setEditingHistory(null);
            mutateHistories();
          }}
        />
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deletingPolicy}
        onOpenChange={(open) => !open && setDeletingPolicy(null)}
        title="패널티 정책 삭제"
        description={`"${deletingPolicy?.penalty_type}" 정책을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDeletePolicy}
        loading={isDeleting}
      />
      <ConfirmDialog
        open={!!deletingHistory}
        onOpenChange={(open) => !open && setDeletingHistory(null)}
        title="패널티 이력 삭제"
        description="이 패널티 이력을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDeleteHistory}
        loading={isDeleting}
      />
    </div>
  );
}
