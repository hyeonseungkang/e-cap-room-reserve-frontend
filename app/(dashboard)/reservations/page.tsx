"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { ErrorPage } from "@/components/error-display";
import { EmptyState } from "@/components/empty-state";
import { ReservationStatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ReservationFormDialog } from "./reservation-form-dialog";
import { formatReservationPeriod, getRelativeTime } from "@/lib/date-utils";
import { fetcher, reservationApi, ApiError } from "@/lib/api";
import type { User, MeetingRoom, Reservation } from "@/lib/types";

export default function ReservationsPage() {
  const { data: users, error: usersError, isLoading: usersLoading, mutate: mutateUsers } = useSWR<User[]>("/user", fetcher);
  const { data: rooms, error: roomsError, isLoading: roomsLoading } = useSWR<MeetingRoom[]>("/meeting-room", fetcher);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<{
    reservation: Reservation;
    userId: number;
  } | null>(null);
  const [deletingReservation, setDeletingReservation] = useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 모든 사용자의 예약을 수집하고 사용자 정보 포함
  const allReservations = useMemo(() => {
    if (!users) return [];

    const reservations: (Reservation & { userName: string; userId: number })[] = [];
    users.forEach((user) => {
      (user.reservations || []).forEach((res) => {
        reservations.push({
          ...res,
          userName: user.name,
          userId: user.user_id,
        });
      });
    });

    // 최신순 정렬
    return reservations.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [users]);

  // 필터링
  const filteredReservations = useMemo(() => {
    return allReservations.filter((res) => {
      // 검색어 필터
      const searchMatch =
        searchQuery === "" ||
        res.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.userName.toLowerCase().includes(searchQuery.toLowerCase());

      // 상태 필터
      const statusMatch =
        statusFilter === "all" || res.reservation_status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [allReservations, searchQuery, statusFilter]);

  const handleDelete = async () => {
    if (!deletingReservation) return;

    setIsDeleting(true);
    try {
      await reservationApi.delete(deletingReservation.reservation_id);
      toast.success("예약이 삭제되었습니다.");
      mutateUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("예약 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
      setDeletingReservation(null);
    }
  };

  const isLoading = usersLoading || roomsLoading;
  const error = usersError || roomsError;

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage message="데이터를 불러오는 중 오류가 발생했습니다." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="예약 현황"
        description="회의실 예약을 관리하세요."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새 예약
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">전체 예약 목록</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="검색 (목적, 예약자)"
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="RESERVED">예약됨</SelectItem>
                  <SelectItem value="COMPLETED">완료</SelectItem>
                  <SelectItem value="CANCELLED">취소됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <EmptyState
              title="예약이 없습니다"
              description={
                searchQuery || statusFilter !== "all"
                  ? "검색 조건에 맞는 예약이 없습니다."
                  : "첫 번째 예약을 생성해 보세요."
              }
              actionLabel={!searchQuery && statusFilter === "all" ? "새 예약" : undefined}
              onAction={!searchQuery && statusFilter === "all" ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>예약 시간</TableHead>
                    <TableHead>회의실</TableHead>
                    <TableHead>예약자</TableHead>
                    <TableHead>목적</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="w-24 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.reservation_id}>
                      <TableCell>
                        <div className="font-medium">
                          {formatReservationPeriod(
                            reservation.start_time,
                            reservation.end_time
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{reservation.room ? reservation.room.room_name : '오류'}</TableCell>
                      <TableCell>{reservation.userName}</TableCell>
                      <TableCell>{reservation.purpose || "-"}</TableCell>
                      <TableCell>
                        <ReservationStatusBadge
                          status={reservation.reservation_status}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getRelativeTime(reservation.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setEditingReservation({
                                reservation,
                                userId: reservation.userId,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingReservation(reservation)}
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
      <ReservationFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        users={users || []}
        rooms={rooms || []}
        onSuccess={() => {
          setIsCreateOpen(false);
          mutateUsers();
        }}
      />

      {/* Edit Dialog */}
      {editingReservation && (
        <ReservationFormDialog
          open={!!editingReservation}
          onOpenChange={(open) => !open && setEditingReservation(null)}
          reservation={editingReservation.reservation}
          userId={editingReservation.userId}
          users={users || []}
          rooms={rooms || []}
          onSuccess={() => {
            setEditingReservation(null);
            mutateUsers();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingReservation}
        onOpenChange={(open) => !open && setDeletingReservation(null)}
        title="예약 삭제"
        description="이 예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
