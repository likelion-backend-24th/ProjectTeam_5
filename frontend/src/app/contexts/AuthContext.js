"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import * as authApi from "@/lib/auth";
import { getAccessToken, setAccessToken, clearAccessToken, onSessionCleared } from "@/lib/tokenStore";
import { tryRefreshToken } from "@/lib/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // accessToken은 메모리에만 있어 새로고침하면 사라진다(XSS로 탈취되지 않게 하려고 localStorage에 안 둔다) —
    // 대신 refreshToken(HttpOnly 쿠키)으로 /api/auth/refresh를 불러 세션을 복구한다.
    // OAuth 로그인 콜백에서도 그대로 쓴다 — 백엔드가 리다이렉트 전에 이미 그 쿠키를 심어두기 때문에
    // 여기서 토큰을 URL로 안 받고도 세션을 세울 수 있다.
    const restoreSession = useCallback(async () => {
        const token = await tryRefreshToken();
        if (!token) {
            setUser(null);
            return null;
        }
        const me = await authApi.getMe();
        setUser(me);
        return me;
    }, []);

    useEffect(() => {
        restoreSession().finally(() => setLoading(false));
    }, [restoreSession]);

    // lib/client.js가 401 재시도 중 refresh까지 실패하면 tokenStore에서 바로 clearAccessToken()을 부른다 —
    // 그 신호를 받아 user 상태도 같이 지워야 화면이 "여전히 로그인된 것처럼" 안 남는다.
    useEffect(() => onSessionCleared(() => setUser(null)), []);

    const login = useCallback(async (email, password) => {
        const { accessToken } = await authApi.login({ email, password });
        setAccessToken(accessToken);
        const me = await authApi.getMe();
        setUser(me);
        return me;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();   // POST /api/auth/logout
        } finally {
            clearAccessToken();
            setUser(null);
        }
    }, []);


    const refreshUser = useCallback(async () => {
        if (!getAccessToken()) return null;
        const me = await authApi.getMe();
        setUser(me);
        return me;
    }, []);

    const value = useMemo(
        () => ({ user, userId: user?.id, isLoggedIn: !!user, loading, login, restoreSession, logout, refreshUser }),
        [user, loading, login, restoreSession, logout, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용하세요");
    return ctx;
}