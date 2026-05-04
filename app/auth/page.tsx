"use client";

import {useState} from "react";
import useSWR from "swr";
import {toast} from "sonner";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/page-header";
import {authApi, ApiError, fetcher} from "@/lib/api";
import type {LoginDto, Me} from "@/lib/types";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {removeAccessToken, saveAccessToken} from "@/lib/utils";

export default function AuthPage() {
    const {data: me} = useSWR<Me | null>(
        `/auth/me`,
        fetcher
    );

    const [newPassword, setNewPassword] = useState({
        password1: '',
        password2: ''
    });

    const [login, setLogin] = useState<LoginDto>({
        email: '',
        type: 'USER',
        password: ''
    });

    const handleLogin = async () => {
        try {
            const loginResponse = await authApi.login(login);
            saveAccessToken(loginResponse.access_token)
            window.location.href = '/';
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(err.message);
            } else {
                toast.error("로그인 중 오류가 발생하였습니다.");
            }
        }
    };

    const handleLogout = async () => {
        removeAccessToken();
        window.location.href = '/';
    };

    const handleUpdatePassword = async () => {
        try {
            const me = await authApi.me();
            await authApi.updatePassword({
                type: me.type,
                password: newPassword.password1,
                email: me.sub
            });
            toast.success("비밀번호를 변경하였습니다.");
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(err.message);
            } else {
                toast.error("비밀번호 변경 중 오류가 발생했습니다.");
            }
        }
    };

    return me ? (
        <div className="space-y-6">
            <PageHeader
                title={me.name}
                description={me.type}
                actions={
                    <Button onClick={() => handleLogout()}>
                        로그아웃
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">비밀번호 변경</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        onChange={(e) =>
                            setNewPassword({...newPassword, password1: e.target.value})
                        }
                        placeholder="비밀번호 입력"
                        type={'password'}
                        maxLength={20}
                    />
                    <br/>
                    <br/>
                    <Input
                        onChange={(e) =>
                            setNewPassword({...newPassword, password2: e.target.value})
                        }
                        placeholder="비밀번호 재입력"
                        type={'password'}
                        maxLength={20}
                    />
                    <br/>
                    <br/>
                    <Button onClick={() => handleUpdatePassword()}>
                        비밀번호 변경
                    </Button>
                </CardContent>
            </Card>
        </div>
    ) : (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">로그인</CardTitle>
            </CardHeader>
            <CardContent>
                <Input
                    onChange={(e) =>
                        setLogin({...login, email: e.target.value})
                    }
                    placeholder="이메일"
                    type={'email'}
                    maxLength={20}
                />
                <br/><br/>
                <Input
                    onChange={(e) =>
                        setLogin({...login, password: e.target.value})
                    }
                    placeholder="비밀번호"
                    type={'password'}
                    maxLength={20}
                />
                <br/><br/>
                <Select
                    value={login.type}
                    onValueChange={(value) =>
                        setLogin({...login, type: value})
                    }
                >
                    <SelectTrigger>
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem key={'USER'} value={'USER'}>
                            사용자
                        </SelectItem>
                        <SelectItem key={'ADMIN'} value={'ADMIN'}>
                            관리자
                        </SelectItem>
                    </SelectContent>
                </Select>
                <br/>
                <Button onClick={() => handleLogin()}>
                    로그인
                </Button>
            </CardContent>
        </Card>
    )
}
