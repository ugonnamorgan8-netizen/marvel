import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, CreditCard, Calendar, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingPayments: number;
  todayAttendance: number;
}

interface StatsResponse {
  status: string;
  data: { stats: DashboardStats };
}

export default function Dashboard() {
  const { data: statsResponse, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentStudentsResponse, isLoading: studentsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/recent-students"],
  });

  const { data: recentPaymentsResponse, isLoading: paymentsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/recent-payments"],
  });

  const stats = statsResponse?.data?.stats;
  const recentStudents = recentStudentsResponse?.data?.students || [];
  const recentPayments = recentPaymentsResponse?.data?.payments || [];

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      description: "All enrolled students",
      color: "text-blue-600",
    },
    {
      title: "Active Students",
      value: stats?.activeStudents || 0,
      icon: UserCheck,
      description: "Currently training",
      color: "text-green-600",
    },
    {
      title: "Pending Payments",
      value: stats?.pendingPayments || 0,
      icon: CreditCard,
      description: "Awaiting payment",
      color: "text-orange-600",
    },
    {
      title: "Today's Attendance",
      value: stats?.todayAttendance || 0,
      icon: Calendar,
      description: "Present today",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your driving school.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
                  {stat.value}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Students
            </CardTitle>
            <CardDescription>Latest student enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No students yet</p>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`student-row-${student.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {student.studentCode}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        student.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>Latest payment activities</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentPayments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`payment-row-${payment.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{payment.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
