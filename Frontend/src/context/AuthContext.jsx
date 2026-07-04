import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  setAccessToken,
  setUnauthorizedHandler,
  refreshAccessToken,
} from "../api/client.js";
import {
  login as apiLogin,
  logout as apiLogout,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  getMe,
} from "../api/authApi.js";

const AuthContext = createContext(null);

let bootPromise = null;

function bootstrapSession() {
  if (!bootPromise) {
    bootPromise = refreshAccessToken().finally(() => {
      bootPromise = null;
    });
  }
  return bootPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      navigate("/login", { replace: true, state: { sessionExpired: true } });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const refreshData = await bootstrapSession();
        if (!refreshData?.accessToken) throw new Error("No session");

        const me = await getMe();
        if (mountedRef.current) setUser(me);
      } catch {
        if (mountedRef.current) clearSession();
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [clearSession]);

  const login = async (credentials) => {
    const data = await apiLogin(credentials);
    const user = data?.user || data?.data?.user || data?.data;

    setUser(user);
    return data.user;
  };

  const sendOtp = async (payload) => apiSendOtp(payload);

  const verifyOtp = async (payload) => {
    const data = await apiVerifyOtp(payload);
    const user = data?.user || data?.data?.user || data?.data;

    setUser(user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  const refreshUser = async () => {
    const me = await getMe();
    setUser(me);
    return me;
  };

  const canWrite = !!user;
  const isAdmin = !!user;

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
