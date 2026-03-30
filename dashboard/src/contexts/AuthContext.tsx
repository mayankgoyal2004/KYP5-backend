import { createContext, useCallback, useEffect, useState, useContext, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { TokenStorage } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

// ─── Types ──────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: { id: string; name: string };
  phone: string | null;
  avatarUrl: string | null;
  designation: string | null;
  department: string | null;
  bio: string | null;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
}

export interface Permission {
  module: string;
  action: string;
  granted: boolean;
}

interface AuthState {
  user: User | null;
  permissions: Permission[];
  permissionsByModule: Record<string, string[]>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  can: (module: string, action: string) => boolean;
  canAny: (module: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

// ─── Context ────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: [],
  permissionsByModule: {},
  isAuthenticated: false,
  isLoading: true,
  login: async () => { },
  logout: async () => { },
  refreshUser: async () => { },
  can: () => false,
  canAny: () => false,
  hasRole: () => false,
});

// ─── Provider ───────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: TokenStorage.getStoredUser(),
    permissions: TokenStorage.getStoredPermissions()?.permissions || [],
    permissionsByModule: TokenStorage.getStoredPermissions()?.permissionsByModule || {},
    isAuthenticated: !!TokenStorage.getAccessToken(),
    isLoading: true,
  });

  // ─── Load permissions from API ──────────────────────
  const loadPermissions = useCallback(async () => {
    try {
      const res = await authApi.getMyPermissions();
      const { permissions, permissionsByModule } = res.data.data;

      TokenStorage.setStoredPermissions({ permissions, permissionsByModule });

      setState((prev) => ({
        ...prev,
        permissions,
        permissionsByModule,
      }));
    } catch (error) {
      console.error("Failed to load permissions:", error);
    }
  }, []);

  // ─── Initialize: Check if user has valid session ────
  useEffect(() => {
    const init = async () => {
      const accessToken = TokenStorage.getAccessToken();

      if (!accessToken) {
        setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
        return;
      }

      try {
        // Fetch current user using existing access token
        const meRes = await authApi.getMe();
        const user = meRes.data.data;

        TokenStorage.setStoredUser(user);

        setState((prev) => ({
          ...prev,
          user,
          isAuthenticated: true,
          isLoading: false,
        }));

        // Load permissions in background
        await loadPermissions();
      } catch (error) {
        // Validation failed (e.g., token expired) — clear everything
        TokenStorage.clearAll();
        setState({
          user: null,
          permissions: [],
          permissionsByModule: {},
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    init();
  }, [loadPermissions]);

  // ─── Login ──────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      const { user, accessToken } = res.data.data;

      TokenStorage.setAccessToken(accessToken);
      TokenStorage.setStoredUser(user);

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
      }));

      // Load permissions
      await loadPermissions();

      // Redirect based on forcePasswordChange
      if (user.forcePasswordChange) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    },
    [navigate, loadPermissions]
  );

  // ─── Logout ─────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const accessToken = TokenStorage.getAccessToken();
      if (accessToken) {
        await authApi.logout().catch(() => { });
      }
    } finally {
      TokenStorage.clearAll();
      queryClient.clear();
      setState({
        user: null,
        permissions: [],
        permissionsByModule: {},
        isAuthenticated: false,
        isLoading: false,
      });
      navigate("/login");
    }
  }, [navigate]);

  // ─── Refresh user data ──────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      const user = res.data.data;
      TokenStorage.setStoredUser(user);
      setState((prev) => ({ ...prev, user }));
      await loadPermissions();
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, [loadPermissions]);

  // ─── Permission checkers ────────────────────────────
  const can = useCallback(
    (module: string, action: string): boolean => {
      if (!state.isAuthenticated) return false;
      // Admin always has access
      if (state.user?.role?.name === "SUPER_ADMIN") return true;
      return state.permissions.some(
        (p) => p.module === module && p.action === action && p.granted
      );
    },
    [state.permissions, state.isAuthenticated, state.user?.role]
  );

  const canAny = useCallback(
    (module: string): boolean => {
      if (!state.isAuthenticated) return false;
      if (state.user?.role?.name === "SUPER_ADMIN") return true;
      return !!state.permissionsByModule[module]?.length;
    },
    [state.permissionsByModule, state.isAuthenticated, state.user?.role]
  );

  const hasRole = useCallback(
    (...roles: string[]): boolean => {
      if (!state.user?.role) return false;
      return roles.includes(state.user.role.name);
    },
    [state.user]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUser,
        can,
        canAny,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};