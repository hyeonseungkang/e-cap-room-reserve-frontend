"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Mail, Phone, Building } from "lucide-react";
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
import { UserFormDialog } from "./user-form-dialog";
import { getRelativeTime } from "@/lib/date-utils";
import { fetcher, userApi, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const { data: users, error, isLoading, mutate } = useSWR<User[]>("/user", fetcher);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    try {
      await userApi.delete(deletingUser.user_id);
      toast.success("사용자가 삭제되었습니다.");
      mutate();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("사용자 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
      setDeletingUser(null);
    }
  };

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage message="사용자 목록을 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="사용자 관리"
        description="시스템 사용자를 관리하세요."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전체 사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <EmptyState
              title="등록된 사용자가 없습니다"
              description="첫 번째 사용자를 추가해 보세요."
              actionLabel="사용자 추가"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>직책</TableHead>
                    <TableHead>예약 수</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead className="w-24 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.department ? (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {user.department}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                          {user.role}
                      </TableCell>
                      <TableCell>
                        {user.reservations?.length || 0}건
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getRelativeTime(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingUser(user)}
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
      <UserFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          mutate();
        }}
      />

      {/* Edit Dialog */}
      {editingUser && (
        <UserFormDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onSuccess={() => {
            setEditingUser(null);
            mutate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="사용자 삭제"
        description={`"${deletingUser?.name}" 사용자를 삭제하시겠습니까? 사용자의 모든 예약도 함께 삭제됩니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
