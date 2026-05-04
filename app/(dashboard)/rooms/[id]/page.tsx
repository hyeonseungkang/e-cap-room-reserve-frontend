"use client";

import { useState } from "react";
import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Users as UsersIcon,
  Shield,
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
} from "lucide-react";
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
import { RoomStatusBadge, ReservationStatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EquipmentFormDialog } from "./equipment-form-dialog";
import { formatReservationPeriod } from "@/lib/date-utils";
import { fetcher, equipmentApi, ApiError } from "@/lib/api";
import type { MeetingRoom, RoomEquipment } from "@/lib/types";

export default function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const roomId = parseInt(id);

  const { data: room, error, isLoading, mutate } = useSWR<MeetingRoom>(
    `/meeting-room/${roomId}`,
    fetcher
  );

  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<RoomEquipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<RoomEquipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEquipment = async () => {
    if (!deletingEquipment) return;

    setIsDeleting(true);
    try {
      await equipmentApi.delete(roomId, deletingEquipment.equipment_id);
      toast.success("장비가 삭제되었습니다.");
      mutate();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("장비 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
      setDeletingEquipment(null);
    }
  };

  if (isLoading) return <LoadingPage />;
  if (error || !room) {
    return (
      <ErrorPage
        title="회의실을 찾을 수 없습니다"
        message="요청하신 회의실이 존재하지 않거나 삭제되었습니다."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/rooms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={room.room_name}
          description={room.location}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Room Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">회의실 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">상태</span>
              <RoomStatusBadge status={room.room_status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">위치</span>
              <span className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4" />
                {room.location}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">수용 인원</span>
              <span className="flex items-center gap-1 text-sm">
                <UsersIcon className="h-4 w-4" />
                {room.capacity}명
              </span>
            </div>
            {room.admin && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">담당자</span>
                <span className="flex items-center gap-1 text-sm">
                  <Shield className="h-4 w-4" />
                  {room.admin.name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">장비 목록</CardTitle>
            <Button size="sm" onClick={() => setIsEquipmentFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              장비 추가
            </Button>
          </CardHeader>
          <CardContent>
            {!room.equipment || room.equipment.length === 0 ? (
              <EmptyState
                title="등록된 장비가 없습니다"
                description="회의실에 장비를 추가해 보세요."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>장비 이름</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead className="w-24 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {room.equipment.map((equipment) => (
                    <TableRow key={equipment.equipment_id}>
                      <TableCell className="font-medium">
                        {equipment.equipment_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {equipment.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingEquipment(equipment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingEquipment(equipment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">예약 현황</CardTitle>
          <Link href="/reservations">
            <Button variant="outline" size="sm">
              <CalendarClock className="mr-2 h-4 w-4" />
              예약 관리
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!room.reservations || room.reservations.length === 0 ? (
            <EmptyState
              title="예약이 없습니다"
              description="이 회의실에 대한 예약이 아직 없습니다."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>예약 시간</TableHead>
                  <TableHead>목적</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {room.reservations.map((reservation) => (
                  <TableRow key={reservation.reservation_id}>
                    <TableCell>
                      {formatReservationPeriod(
                        reservation.start_time,
                        reservation.end_time
                      )}
                    </TableCell>
                    <TableCell>{reservation.purpose || "-"}</TableCell>
                    <TableCell>
                      <ReservationStatusBadge
                        status={reservation.reservation_status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Equipment Form Dialog */}
      <EquipmentFormDialog
        open={isEquipmentFormOpen}
        onOpenChange={setIsEquipmentFormOpen}
        roomId={roomId}
        onSuccess={() => {
          setIsEquipmentFormOpen(false);
          mutate();
        }}
      />

      {/* Edit Equipment Dialog */}
      {editingEquipment && (
        <EquipmentFormDialog
          open={!!editingEquipment}
          onOpenChange={(open) => !open && setEditingEquipment(null)}
          roomId={roomId}
          equipment={editingEquipment}
          onSuccess={() => {
            setEditingEquipment(null);
            mutate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingEquipment}
        onOpenChange={(open) => !open && setDeletingEquipment(null)}
        title="장비 삭제"
        description={`"${deletingEquipment?.equipment_name}" 장비를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDeleteEquipment}
        loading={isDeleting}
      />
    </div>
  );
}
