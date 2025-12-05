import { queryClient, apiRequest } from "./queryClient";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "staff" | "viewer";
}

interface Student {
  id: number;
  studentCode: string;
  firstName: string;
  lastName: string;
}

export interface AuthState {
  user: User | null;
  student: Student | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  type: "user" | "student" | null;
}

const AUTH_STORAGE_KEY = "marvel_auth";

export function getStoredAuth(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {
    user: null,
    student: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    type: null,
  };
}

export function setStoredAuth(auth: Partial<AuthState>): void {
  const current = getStoredAuth();
  const updated = { ...current, ...auth };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getStoredAuth().accessToken;
}

export async function login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  const data = response.data;
  
  setStoredAuth({
    user: data.user,
    student: null,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    isAuthenticated: true,
    type: "user",
  });
  
  return data;
}

export async function viewerLogin(studentCode: string): Promise<{ student: Student; accessToken: string }> {
  const response = await apiRequest("POST", "/api/auth/viewer-login", { studentCode });
  const data = response.data;
  
  setStoredAuth({
    user: null,
    student: data.student,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    isAuthenticated: true,
    type: "student",
  });
  
  return data;
}

export async function logout(): Promise<void> {
  const { accessToken } = getStoredAuth();
  
  if (accessToken) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // ignore logout errors
    }
  }
  
  clearStoredAuth();
  queryClient.clear();
}

export async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getStoredAuth();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      clearStoredAuth();
      return null;
    }
    
    const data = await response.json();
    
    setStoredAuth({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken || refreshToken,
    });
    
    return data.data.accessToken;
  } catch {
    clearStoredAuth();
    return null;
  }
}
