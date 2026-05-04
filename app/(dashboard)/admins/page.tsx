"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Mail, Building, DoorOpen } from "lucide-react";
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
import { AdminFormDialog } from "./admin-form-dialog";
import { getRelativeTime } from "@/lib/date-utils";
import { fetcher, adminApi, ApiError } from "@/lib/api";
import type { Admin } from "@/lib/types";

export default function AdminsPage() {
  const { data: admins, error, isLoading, mutate } = useSWR<Admin[]>("/admin", fetcher);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingAdmin) return;

    setIsDeleting(true);
    try {
      await adminApi.delete(deletingAdmin.admin_id);
      toast.success("관리자가 삭제되었습니다.");
      mutate();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("관리자 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
      setDeletingAdmin(null);
    }
  };

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage message="관리자 목록을 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="관리자 설정"
        description="시스템 관리자를 관리하세요."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            관리자 추가
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전체 관리자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {!admins || admins.length === 0 ? (
            <EmptyState
              title="등록된 관리자가 없습니다"
              description="첫 번째 관리자를 추가해 보세요."
              actionLabel="관리자 추가"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>담당 회의실</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="w-24 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.admin_id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.department ? (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {admin.department}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {admin.rooms && admin.rooms.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <DoorOpen className="h-3 w-3 text-muted-foreground" />
                            {admin.rooms.map((r) => r.room_name).join(", ")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getRelativeTime(admin.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingAdmin(admin)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingAdmin(admin)}
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

      {/* Create Dialog */}
      <AdminFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          mutate();
        }}
      />

      {/* Edit Dialog */}
      {editingAdmin && (
        <AdminFormDialog
          open={!!editingAdmin}
          onOpenChange={(open) => !open && setEditingAdmin(null)}
          admin={editingAdmin}
          onSuccess={() => {
            setEditingAdmin(null);
            mutate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingAdmin}
        onOpenChange={(open) => !open && setDeletingAdmin(null)}
        title="관리자 삭제"
        description={`"${deletingAdmin?.name}" 관리자를 삭제하시겠습니까? 담당 회의실은 담당자 없음으로 변경됩니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
