"use client";

import {useState} from "react";
import {toast} from "sonner";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/page-header";
import {authApi, userApi, adminApi, ApiError} from "@/lib/api";
import type {AccountType, LoginDto} from "@/lib/types";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Spinner} from "@/components/ui/spinner";
import {clearSession, saveAccessToken, saveSession} from "@/lib/utils";
import {useSession} from "@/hooks/use-session";

export default function AuthPage() {
    const {session, loaded} = useSession();

    const [type, setType] = useState<AccountType>("user");
    const [login, setLogin] = useState<LoginDto>({email: "", password: ""});
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [newPassword, setNewPassword] = useState({password1: "", password2: ""});
    const [isUpdating, setIsUpdating] = useState(false);

    const handleLogin = async () => {
        if (!login.email || !login.password) {
            toast.error("이메일과 비밀번호를 입력해 주세요.");
            return;
        }
        setIsLoggingIn(true);
        try {
            if (type === "admin") {
                const res = await authApi.adminLogin(login);
                saveAccessToken(res.access_token);
                saveSession({
                    id: res.admin.admin_id,
                    name: res.admin.name,
                    email: res.admin.email,
                    type: "admin",
                });
            } else {
                const res = await authApi.userLogin(login);
                saveAccessToken(res.access_token);
                saveSession({
                    id: res.user.user_id,
                    name: res.user.name,
                    email: res.user.email,
                    type: "user",
                });
            }
            window.location.href = "/";
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(err.message);
            } else {
                toast.error("로그인 중 오류가 발생하였습니다.");
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        window.location.href = "/auth";
    };

    const handleUpdatePassword = async () => {
        if (!session) return;
        if (!newPassword.password1) {
            toast.error("새 비밀번호를 입력해 주세요.");
            return;
        }
        if (newPassword.password1 !== newPassword.password2) {
            toast.error("비밀번호가 일치하지 않습니다.");
            return;
        }
        setIsUpdating(true);
        try {
            if (session.type === "admin") {
                await adminApi.update(session.id, {password: newPassword.password1});
            } else {
                await userApi.update(session.id, {password: newPassword.password1});
            }
            toast.success("비밀번호를 변경하였습니다.");
            setNewPassword({password1: "", password2: ""});
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(err.message);
            } else {
                toast.error("비밀번호 변경 중 오류가 발생했습니다.");
            }
        } finally {
            setIsUpdating(false);
        }
    };

    if (!loaded) return null;

    return session ? (
        <div className="space-y-6">
            <PageHeader
                title={session.name}
                description={session.type === "admin" ? "관리자" : "사용자"}
                actions={<Button onClick={handleLogout}>로그아웃</Button>}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">비밀번호 변경</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password1">새 비밀번호</Label>
                        <Input
                            id="password1"
                            value={newPassword.password1}
                            onChange={(e) => setNewPassword({...newPassword, password1: e.target.value})}
                            placeholder="비밀번호 입력"
                            type="password"
                            maxLength={100}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password2">새 비밀번호 확인</Label>
                        <Input
                            id="password2"
                            value={newPassword.password2}
                            onChange={(e) => setNewPassword({...newPassword, password2: e.target.value})}
                            placeholder="비밀번호 재입력"
                            type="password"
                            maxLength={100}
                        />
                    </div>
                    <Button onClick={handleUpdatePassword} disabled={isUpdating}>
                        {isUpdating && <Spinner className="mr-2"/>}
                        비밀번호 변경
                    </Button>
                </CardContent>
            </Card>
        </div>
    ) : (
        <div className="mx-auto max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">로그인</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="account-type">계정 유형</Label>
                        <Select value={type} onValueChange={(value) => setType(value as AccountType)}>
                            <SelectTrigger id="account-type">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">사용자</SelectItem>
                                <SelectItem value="admin">관리자</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input
                            id="email"
                            value={login.email}
                            onChange={(e) => setLogin({...login, email: e.target.value})}
                            placeholder="example@company.com"
                            type="email"
                            maxLength={100}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">비밀번호</Label>
                        <Input
                            id="password"
                            value={login.password}
                            onChange={(e) => setLogin({...login, password: e.target.value})}
                            placeholder="비밀번호"
                            type="password"
                            maxLength={100}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                    </div>
                    <Button className="w-full" onClick={handleLogin} disabled={isLoggingIn}>
                        {isLoggingIn && <Spinner className="mr-2"/>}
                        로그인
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
