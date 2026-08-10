"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import * as authApi from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setLoading(false);
            return;
        }

        authApi.getMe(token)
            .then((me) => {
                setUser(me);
            })
            .catch((err) => {
                localStorage.removeItem("accessToken");
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);


    const loginWithToken = useCallback(async (accessToken) => {
        localStorage.setItem("accessToken", accessToken);
        const me = await authApi.getMe(accessToken);
        setUser(me);
        return me;
    }, []);

    const login = useCallback(async (email, password) => {
        const { accessToken } = await authApi.login({ email, password });
        localStorage.setItem("accessToken", accessToken);
        const me = await authApi.getMe(accessToken);
        setUser(me);
        return me;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();   // POST /api/auth/logout
        } finally {
            localStorage.removeItem("accessToken");
            setUser(null);
        }
    }, []);


    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;
        const me = await authApi.getMe(token);
        setUser(me);
        return me;
    }, []);

    const value = useMemo(
        () => ({ user, userId: user?.id, isLoggedIn: !!user, loading, login, loginWithToken, logout, refreshUser }),
        [user, loading, login, loginWithToken, logout, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 사용하세요");
    return ctx;
}