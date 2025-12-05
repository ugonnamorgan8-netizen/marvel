import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getStoredAuth, login as authLogin, viewerLogin as authViewerLogin, logout as authLogout, type AuthState } from "@/lib/auth";

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

interface AuthContextType {
  user: User | null;
  student: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  type: "user" | "student" | null;
  login: (email: string, password: string) => Promise<void>;
  viewerLogin: (studentCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState<"user" | "student" | null>(null);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored.isAuthenticated) {
      setUser(stored.user);
      setStudent(stored.student);
      setIsAuthenticated(true);
      setType(stored.type);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { user: userData } = await authLogin(email, password);
    setUser(userData);
    setStudent(null);
    setIsAuthenticated(true);
    setType("user");
  };

  const viewerLogin = async (studentCode: string) => {
    const { student: studentData } = await authViewerLogin(studentCode);
    setStudent(studentData);
    setUser(null);
    setIsAuthenticated(true);
    setType("student");
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
    setStudent(null);
    setIsAuthenticated(false);
    setType(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        isAuthenticated,
        isLoading,
        type,
        login,
        viewerLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
