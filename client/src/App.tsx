import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import Attendance from "@/pages/Attendance";
import Training from "@/pages/Training";
import Payments from "@/pages/Payments";
import Documents from "@/pages/Documents";
import StudentPortal from "@/pages/StudentPortal";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, type } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (type === "student") {
    return <Redirect to="/student" />;
  }

  return <>{children}</>;
}

function StaffLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, type, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          type === "student" ? (
            <Redirect to="/student" />
          ) : (
            <Redirect to="/dashboard" />
          )
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/student">
        {isAuthenticated && type === "student" ? <StudentPortal /> : <Redirect to="/" />}
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <StaffLayout>
            <Dashboard />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/students">
        <ProtectedRoute>
          <StaffLayout>
            <Students />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/students/:id">
        <ProtectedRoute>
          <StaffLayout>
            <StudentDetail />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/attendance">
        <ProtectedRoute>
          <StaffLayout>
            <Attendance />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/training">
        <ProtectedRoute>
          <StaffLayout>
            <Training />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/payments">
        <ProtectedRoute>
          <StaffLayout>
            <Payments />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/documents">
        <ProtectedRoute>
          <StaffLayout>
            <Documents />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
