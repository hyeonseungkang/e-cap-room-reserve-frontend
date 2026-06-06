"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CancellationFormDialog } from "./cancellation-form-dialog";
import { formatDateTime } from "@/lib/date-utils";
import { flattenReservations } from "@/lib/reservation-utils";
import { fetcher, cancellationLogApi, ApiError } from "@/lib/api";
import type { CancellationLog, User } from "@/lib/types";

export default function CancellationsPage() {
  const { data: logs, error, isLoading, mutate } = useSWR<CancellationLog[]>(
    "/cancellation-log",
    fetcher
  );
  const { data: users } = useSWR<User[]>("/user", fetcher);
  const reservations = flattenReservations(users);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CancellationLog | null>(null);
  const [deleting, setDeleting] = useState<CancellationLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await cancellationLogApi.delete(deleting.cancellation_id);
      toast.success("취소 기록이 삭제되었습니다.");
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
  if (error) return <ErrorPage message="취소 기록을 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="취소 기록"
        description="예약 취소 기록과 긴급 취소 여부를 관리하세요."
        // actions={
        //   <Button onClick={() => setIsCreateOpen(true)}>
        //     <Plus className="mr-2 h-4 w-4" />
        //     취소 기록 생성
        //   </Button>
        // }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전체 취소 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <EmptyState
              title="취소 기록이 없습니다"
              description="첫 번째 취소 기록을 생성해 보세요."
              actionLabel="취소 기록 생성"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>예약</TableHead>
                    <TableHead>취소 사유</TableHead>
                    <TableHead>구분</TableHead>
                    <TableHead>취소 일시</TableHead>
                    <TableHead className="w-24 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.cancellation_id}>
                      <TableCell className="font-medium">
                        {log.reservation
                          ? `#${log.reservation.reservation_id}`
                          : "-"}
                      </TableCell>
                      <TableCell>{log.cancel_reason || "-"}</TableCell>
                      <TableCell>
                        {log.is_late_cancel ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 hover:bg-red-100"
                          >
                            긴급 취소
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-700 hover:bg-gray-100"
                          >
                            일반 취소
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(log.cancelled_at)}
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
                          {/* <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleting(log)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button> */}
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

      <CancellationFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        reservations={reservations}
        onSuccess={() => {
          setIsCreateOpen(false);
          mutate();
        }}
      />

      {editing && (
        <CancellationFormDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          log={editing}
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
        title="취소 기록 삭제"
        description="이 취소 기록을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
