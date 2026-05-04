"use client";

import {useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {
    LayoutDashboard,
    DoorOpen,
    CalendarClock,
    Users,
    Shield,
    Building2,
    Users2,
    Menu,
    X,
} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import useSWR from "swr";
import {fetcher} from "@/lib/api";
import {Me} from "@/lib/types";

const navigation = [
    {name: "대시보드", href: "/", icon: LayoutDashboard},
    {name: "회의실", href: "/rooms", icon: DoorOpen},
    {name: "예약 현황", href: "/reservations", icon: CalendarClock},
    {name: "사용자 관리", href: "/users", icon: Users},
    {name: "관리자 설정", href: "/admins", icon: Shield},
];

function SidebarContent({onNavigate}: { onNavigate?: () => void }) {
    const pathname = usePathname();

    const {data: me} = useSWR<Me|null>(
        `/auth/me`,
        fetcher
    );

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-20 items-center gap-3 border-b border-border px-6">
                <Building2 className="h-8 w-8 text-blue-600"/>
                <div>
                    <h1 className="text-lg font-semibold text-foreground">회의실 예약</h1>
                    <p className="text-xs text-muted-foreground">사내 예약 시스템</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                <Link
                    key={'auth'}
                    href={'/auth'}
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Users2 className="h-8 w-8"/>
                    <div>
                        {me ?
                            (<><p className="text-ms text-foreground">{me.name}</p>
                                <p className="text-xs text-foreground">{me.type}</p></>) :
                            (<><p className="text-ms text-foreground">로그인 후 사용가능</p>
                            </>)
                        }
                    </div>
                </Link>
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5"/>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-border p-4">
                <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-700">도움이 필요하신가요?</p>
                    <p className="mt-1 text-xs text-blue-600">관리자에게 문의해 주세요.</p>
                </div>
            </div>
        </div>
    );
}

export function AppSidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <header
                className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="lg:hidden">
                            <Menu className="h-5 w-5"/>
                            <span className="sr-only">메뉴 열기</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <SidebarContent onNavigate={() => setIsOpen(false)}/>
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600"/>
                    <span className="font-semibold">회의실 예약</span>
                </div>
            </header>

            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
                <SidebarContent/>
            </aside>
        </>
    );
}
