"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, MapPin, Users as UsersIcon, Wrench, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { ErrorPage } from "@/components/error-display";
import { EmptyState } from "@/components/empty-state";
import { RoomStatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoomFormDialog } from "./room-form-dialog";
import { fetcher, meetingRoomApi, ApiError } from "@/lib/api";
import type { MeetingRoom, Admin } from "@/lib/types";

export default function RoomsPage() {
  const { data: rooms, error, isLoading, mutate } = useSWR<MeetingRoom[]>("/meeting-room", fetcher);
  const { data: admins } = useSWR<Admin[]>("/admin", fetcher);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<MeetingRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingRoom) return;

    setIsDeleting(true);
    try {
      await meetingRoomApi.delete(deletingRoom.room_id);
      toast.success("회의실이 삭제되었습니다.");
      mutate();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("회의실 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
      setDeletingRoom(null);
    }
  };

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage message="회의실 목록을 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="회의실"
        description="사내 회의실을 관리하고 예약 현황을 확인하세요."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            회의실 추가
          </Button>
        }
      />

      {!rooms || rooms.length === 0 ? (
        <EmptyState
          title="등록된 회의실이 없습니다"
          description="첫 번째 회의실을 추가해 보세요."
          actionLabel="회의실 추가"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.room_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <Link href={`/rooms/${room.room_id}`}>
                    <CardTitle className="text-lg hover:text-blue-600 transition-colors cursor-pointer">
                      {room.room_name}
                    </CardTitle>
                  </Link>
                  <RoomStatusBadge status={room.room_status} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingRoom(room)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingRoom(room)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{room.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UsersIcon className="h-4 w-4" />
                  <span>{room.capacity}명 수용 가능</span>
                </div>
                {room.equipment && room.equipment.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Wrench className="h-4 w-4 mt-0.5" />
                    <span className="flex-1">
                      {room.equipment.map((e) => e.equipment_name).join(", ")}
                    </span>
                  </div>
                )}
                {room.admin && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      담당자: {room.admin.name}
                    </p>
                  </div>
                )}
                <Link href={`/rooms/${room.room_id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    상세 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <RoomFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        admins={admins || []}
        onSuccess={() => {
          setIsCreateOpen(false);
          mutate();
        }}
      />

      {/* Edit Dialog */}
      {editingRoom && (
        <RoomFormDialog
          open={!!editingRoom}
          onOpenChange={(open) => !open && setEditingRoom(null)}
          room={editingRoom}
          admins={admins || []}
          onSuccess={() => {
            setEditingRoom(null);
            mutate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingRoom}
        onOpenChange={(open) => !open && setDeletingRoom(null)}
        title="회의실 삭제"
        description={`"${deletingRoom?.room_name}" 회의실을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
