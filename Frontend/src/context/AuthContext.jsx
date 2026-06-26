import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, setUnauthorizedHandler } from "../api/client.js";
import {
  login as apiLogin,
  logout as apiLogout,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  refreshSession,
  getMe,
} from "../api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const data = await refreshSession();
        setUser(data.user);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession]);

  const login = async (credentials) => {
    const data = await apiLogin(credentials);
    setUser(data.user);
    return data.user;
  };

  const sendOtp = async (payload) => apiSendOtp(payload);

  const verifyOtp = async (payload) => {
    const data = await apiVerifyOtp(payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await apiLogout();
    clearSession();
    navigate("/login", { replace: true });
  };

  const refreshUser = async () => {
    const me = await getMe();
    setUser(me);
    return me;
  };

  const canWrite = user?.role === "admin" || user?.role === "pharmacist";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      sendOtp,
      verifyOtp,
      logout,
      refreshUser,
      canWrite,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
