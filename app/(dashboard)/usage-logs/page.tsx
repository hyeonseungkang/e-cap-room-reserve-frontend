"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { GenericStatusBadge } from "@/components/status-badge";
import { UsageLogFormDialog } from "./usage-log-form-dialog";
import { formatDateTime } from "@/lib/date-utils";
import { flattenReservations } from "@/lib/reservation-utils";
import { fetcher, usageLogApi, ApiError } from "@/lib/api";
import type { UsageLog, User, CancellationLog } from "@/lib/types";

export default function UsageLogsPage() {
  const { data: logs, error, isLoading, mutate } = useSWR<UsageLog[]>(
    "/usage-log",
    fetcher
  );
  const { data: users } = useSWR<User[]>("/user", fetcher);
  const { data: cancellationLogs } = useSWR<CancellationLog[]>(
    "/cancellation-log",
    fetcher
  );
  const reservations = flattenReservations(users);

  // 취소 기록이 있는 예약 ID 집합
  const canceledReservationIds = new Set(
    (cancellationLogs || [])
      .map((log) => log.reservation?.reservation_id)
      .filter((id): id is number => id != null)
  );
  // 이용 기록 생성 가능한 예약: 상태 RESERVED + 취소 기록 없음
  const selectableReservations = reservations.filter(
    (res) =>
      res.reservation_status === "RESERVED" &&
      !canceledReservationIds.has(res.reservation_id)
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UsageLog | null>(null);
  const [deleting, setDeleting] = useState<UsageLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await usageLogApi.delete(deleting.usage_id);
      toast.success("이용 기록이 삭제되었습니다.");
      mutate();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setDeleting(null);
    }
  };

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage message="이용 기록을 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="이용 기록"
        description="회의실 체크인/체크아웃 이용 기록을 관리하세요. (예약 1건당 1개)"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            이용 기록 생성
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전체 이용 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <EmptyState
              title="이용 기록이 없습니다"
              description="첫 번째 이용 기록을 생성해 보세요."
              actionLabel="이용 기록 생성"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>예약</TableHead>
                    <TableHead>회의실</TableHead>
                    <TableHead>체크인</TableHead>
                    <TableHead>체크아웃</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-24 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.usage_id}>
                      <TableCell className="font-medium">
                        {log.reservation
                          ? `#${log.reservation.reservation_id}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {log.reservation?.room?.room_name || "-"}
                      </TableCell>
                      <TableCell>
                        {log.check_in_time ? formatDateTime(log.check_in_time) : "-"}
                      </TableCell>
                      <TableCell>
                        {log.check_out_time
                          ? formatDateTime(log.check_out_time)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <GenericStatusBadge status={log.usage_status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditing(log)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleting(log)}
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

      <UsageLogFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        reservations={selectableReservations}
        onSuccess={() => {
          setIsCreateOpen(false);
          mutate();
        }}
      />

      {editing && (
        <UsageLogFormDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          usageLog={editing}
          reservations={reservations}
          onSuccess={() => {
            setEditing(null);
            mutate();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="이용 기록 삭제"
        description="이 이용 기록을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
