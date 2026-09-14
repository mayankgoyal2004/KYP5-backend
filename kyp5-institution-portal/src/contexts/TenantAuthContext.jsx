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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/admin/auth/login", { email, password });
      if (res.data?.success) {
        const { accessToken, user: userData, institution: instData } = res.data.data;
        setToken(accessToken);
        setUser(userData);
        if (instData) setInstitution(instData);

        localStorage.setItem("tenantToken", accessToken);
        localStorage.setItem("tenantUser", JSON.stringify(userData));
        if (instData) localStorage.setItem("tenantInstitution", JSON.stringify(instData));
        return { success: true };
      }
      throw new Error(res.data?.message || "Login failed");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password. Please try again.";
      console.warn("Authentication failure:", message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setInstitution(null);
    localStorage.removeItem("tenantToken");
    localStorage.removeItem("tenantUser");
    localStorage.removeItem("tenantInstitution");
  };

  return (
    <TenantAuthContext.Provider
      value={{
        token,
        user,
        institution,
        isAuthenticated: !!token,
        loading,
        login,
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
