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
import { MaintenanceFormDialog } from "./maintenance-form-dialog";
import { fetcher, maintenanceApi, ApiError } from "@/lib/api";
import type { RoomMaintenanceLog, MeetingRoom, Admin } from "@/lib/types";

export default function MaintenancePage() {
  const { data: logs, error, isLoading, mutate } = useSWR<RoomMaintenanceLog[]>(
    "/maintenance",
    fetcher
  );
  const { data: rooms } = useSWR<MeetingRoom[]>("/meeting-room", fetcher);
  const { data: admins } = useSWR<Admin[]>("/admin", fetcher);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<RoomMaintenanceLog | null>(null);
  const [deleting, setDeleting] = useState<RoomMaintenanceLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await maintenanceApi.delete(deleting.maintenance_id);
      toast.success("유지보수 로그가 삭제되었습니다.");
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
  if (error) return <ErrorPage message="유지보수 로그를 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="유지보수"
        description="회의실 유지보수 로그를 관리하세요."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            유지보수 로그 생성
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전체 유지보수 로그</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <EmptyState
              title="유지보수 로그가 없습니다"
              description="첫 번째 유지보수 로그를 생성해 보세요."
              actionLabel="유지보수 로그 생성"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>회의실</TableHead>
                    <TableHead>유지보수 유형</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>담당 관리자</TableHead>
                    <TableHead className="w-24 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.maintenance_id}>
                      <TableCell className="font-medium">
                        {log.room?.room_name || "-"}
                      </TableCell>
                      <TableCell>{log.maintenance_type || "-"}</TableCell>
                      <TableCell>
                        <GenericStatusBadge status={log.maintenance_status} />
                      </TableCell>
                      <TableCell>{log.admin?.name || "-"}</TableCell>
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

      <MaintenanceFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        rooms={rooms || []}
        admins={admins || []}
        onSuccess={() => {
          setIsCreateOpen(false);
          mutate();
        }}
      />

      {editing && (
        <MaintenanceFormDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          log={editing}
          rooms={rooms || []}
          admins={admins || []}
          onSuccess={() => {
            setEditing(null);
            mutate();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="유지보수 로그 삭제"
        description="이 유지보수 로그를 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
