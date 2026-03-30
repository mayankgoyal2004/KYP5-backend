// Token storage utilities
// Access token in memory (more secure), refresh token in localStorage

let inMemoryAccessToken: string | null = null;

export const TokenStorage = {
  getAccessToken: (): string | null => {
    return inMemoryAccessToken || localStorage.getItem("accessToken");
  },

  setAccessToken: (token: string | null): void => {
    inMemoryAccessToken = token;
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  },

  clearAll: (): void => {
    inMemoryAccessToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
  },

  // Persist user data for page refreshes
  getStoredUser: () => {
    try {
      const data = localStorage.getItem("user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setStoredUser: (user: any) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  },

  getStoredPermissions: () => {
    try {
      const data = localStorage.getItem("permissions");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setStoredPermissions: (permissions: any) => {
    if (permissions) {
      localStorage.setItem("permissions", JSON.stringify(permissions));
    } else {
      localStorage.removeItem("permissions");
    }
  },
};