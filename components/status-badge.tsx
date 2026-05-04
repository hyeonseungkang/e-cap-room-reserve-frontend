import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RoomStatusType = "AVAILABLE" | "MAINTENANCE" | "UNAVAILABLE" | string;
type ReservationStatusType = "RESERVED" | "CANCELLED" | "COMPLETED" | string;

interface RoomStatusBadgeProps {
  status: RoomStatusType;
  className?: string;
}

export function RoomStatusBadge({ status, className }: RoomStatusBadgeProps) {
  const getStatusConfig = (status: RoomStatusType) => {
    switch (status.toUpperCase()) {
      case "AVAILABLE":
        return {
          label: "사용 가능",
          className: "bg-green-100 text-green-700 hover:bg-green-100",
        };
      case "MAINTENANCE":
        return {
          label: "점검 중",
          className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        };
      case "UNAVAILABLE":
        return {
          label: "사용 불가",
          className: "bg-red-100 text-red-700 hover:bg-red-100",
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

interface ReservationStatusBadgeProps {
  status: ReservationStatusType;
  className?: string;
}

export function ReservationStatusBadge({
  status,
  className,
}: ReservationStatusBadgeProps) {
  const getStatusConfig = (status: ReservationStatusType) => {
    switch (status.toUpperCase()) {
      case "RESERVED":
        return {
          label: "예약됨",
          className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        };
      case "CANCELLED":
        return {
          label: "취소됨",
          className: "bg-red-100 text-red-700 hover:bg-red-100",
        };
      case "COMPLETED":
        return {
          label: "완료",
          className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

interface UserRoleBadgeProps {
  role: string;
  className?: string;
}
