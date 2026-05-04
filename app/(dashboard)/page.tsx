"use client";

import useSWR from "swr";
import Link from "next/link";
import {
  DoorOpen,
  CalendarClock,
  Users,
  Shield,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading";
import { ErrorPage } from "@/components/error-display";
import { RoomStatusBadge, ReservationStatusBadge } from "@/components/status-badge";
import { formatDateTime, formatReservationPeriod } from "@/lib/date-utils";
import { fetcher } from "@/lib/api";
import type { MeetingRoom, User, Reservation, Admin } from "@/lib/types";

export default function DashboardPage() {
  const { data: rooms, error: roomsError, isLoading: roomsLoading } = useSWR<MeetingRoom[]>("/meeting-room", fetcher);
  const { data: users, error: usersError, isLoading: usersLoading } = useSWR<User[]>("/user", fetcher);
  const { data: admins, error: adminsError, isLoading: adminsLoading } = useSWR<Admin[]>("/admin", fetcher);

  const isLoading = roomsLoading || usersLoading || adminsLoading;
  const error = roomsError || usersError || adminsError;

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage message="데이터를 불러오는 중 오류가 발생했습니다." />;

  // 모든 사용자의 예약을 수집
  const allReservations: Reservation[] = users?.flatMap((u) => u.reservations || []) || [];
  const recentReservations = allReservations
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const availableRooms = rooms?.filter((r) => r.room_status === "AVAILABLE").length || 0;
  const activeReservations = allReservations.filter((r) => r.reservation_status === "RESERVED").length;

  const stats = [
    {
      title: "전체 회의실",
      value: rooms?.length || 0,
      description: `${availableRooms}개 사용 가능`,
      icon: DoorOpen,
      href: "/rooms",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "활성 예약",
      value: activeReservations,
      description: `총 ${allReservations.length}개 예약`,
      icon: CalendarClock,
      href: "/reservations",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "등록 사용자",
      value: users?.length || 0,
      description: "전체 사용자",
      icon: Users,
      href: "/users",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "관리자",
      value: admins?.length || 0,
      description: "시스템 관리자",
      icon: Shield,
      href: "/admins",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description="사내 회의실 예약 시스템 현황을 확인하세요."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <Link href={stat.href}>
                <Button variant="link" className="mt-2 h-auto p-0 text-xs">
                  자세히 보기 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Reservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">최근 예약</CardTitle>
            <Link href="/reservations">
              <Button variant="ghost" size="sm">
                전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentReservations.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                예약이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {recentReservations.map((reservation) => (
                  <div
                    key={reservation.reservation_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {reservation.purpose || "회의"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatReservationPeriod(
                            reservation.start_time,
                            reservation.end_time
                          )}
                        </p>
                      </div>
                    </div>
                    <ReservationStatusBadge status={reservation.reservation_status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">회의실 현황</CardTitle>
            <Link href="/rooms">
              <Button variant="ghost" size="sm">
                전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!rooms || rooms.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                등록된 회의실이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.slice(0, 5).map((room) => (
                  <div
                    key={room.room_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2">
                        <DoorOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{room.room_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.location} · {room.capacity}명 수용
                        </p>
                      </div>
                    </div>
                    <RoomStatusBadge status={room.room_status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
