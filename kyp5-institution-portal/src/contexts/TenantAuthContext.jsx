import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const TenantAuthContext = createContext(null);

export function TenantAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("tenantToken"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tenantUser") || "null");
    } catch {
      return null;
    }
  });
  const [institution, setInstitution] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tenantInstitution") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Sync / validate session on app mount
  useEffect(() => {
    const syncSession = async () => {
      const storedToken = localStorage.getItem("tenantToken");
      if (!storedToken) {
        setInitializing(false);
        return;
      }

      try {
        const res = await api.get("/institution/auth/me");
        if (res.data?.success && res.data.data) {
          const { user: userData, institution: instData } = res.data.data;
          setUser(userData);
          if (instData) setInstitution(instData);
          localStorage.setItem("tenantUser", JSON.stringify(userData));
          if (instData) localStorage.setItem("tenantInstitution", JSON.stringify(instData));
        }
      } catch (err) {
        console.warn("Session verification failed or token expired:", err?.message);
        logout();
      } finally {
        setInitializing(false);
      }
    };

    syncSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/institution/auth/login", { email, password });
      if (res.data?.success) {
        const { accessToken, user: userData, institution: instData } = res.data.data;
        setToken(accessToken);
        setUser(userData);
        if (instData) setInstitution(instData);

        localStorage.setItem("tenantToken", accessToken);
        localStorage.setItem("tenantUser", JSON.stringify(userData));
        if (instData) localStorage.setItem("tenantInstitution", JSON.stringify(instData));
        return { success: true, data: res.data.data };
      }
      throw new Error(res.data?.message || "Login failed");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password. Please try again.";
      console.warn("Tenant authentication failure:", message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post("/public/institution/register", formData);
      if (res.data?.success) {
        const { accessToken, user: userData, institution: instData } = res.data.data;
        setToken(accessToken);
        setUser(userData);
        if (instData) setInstitution(instData);

        localStorage.setItem("tenantToken", accessToken);
        localStorage.setItem("tenantUser", JSON.stringify(userData));
        if (instData) localStorage.setItem("tenantInstitution", JSON.stringify(instData));
        return { success: true, data: res.data.data };
      }
      throw new Error(res.data?.message || "Registration failed");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to register institution. Please verify information and try again.";
      console.warn("Tenant registration failure:", message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post("/institution/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return res.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post("/institution/auth/logout").catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      setInstitution(null);
      localStorage.removeItem("tenantToken");
      localStorage.removeItem("tenantUser");
      localStorage.removeItem("tenantInstitution");
    }
  };

  return (
    <TenantAuthContext.Provider
      value={{
        token,
        user,
        institution,
        isAuthenticated: !!token,
        loading,
        initializing,
        login,
        register,
        changePassword,
        logout,
        setInstitution,
      }}
    >
      {children}
    </TenantAuthContext.Provider>
  );
}

export function useTenantAuth() {
  const context = useContext(TenantAuthContext);
  if (!context) {
    throw new Error("useTenantAuth must be used within TenantAuthProvider");
  }
  return context;
}
