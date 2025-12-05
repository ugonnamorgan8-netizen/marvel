import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  User,
  Calendar,
  CreditCard,
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Car,
} from "lucide-react";

export default function StudentPortal() {
  const { student, logout } = useAuth();

  const { data: response, isLoading } = useQuery<any>({
    queryKey: ["/api/students", student?.id],
    enabled: !!student?.id,
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const studentData = response?.data?.student;
  const documents = response?.data?.documents || [];
  const attendance = response?.data?.attendance || [];
  const payments = response?.data?.payments || [];
  const trainingLogs = response?.data?.trainingLogs || [];

  if (!studentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Student not found</h2>
          <Button variant="link" onClick={handleLogout}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  const attendanceRate =
    attendance.length > 0
      ? Math.round((attendance.filter((a: any) => a.present).length / attendance.length) * 100)
      : 0;

  const completedTraining = trainingLogs.filter((l: any) => l.studentProgress === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Marvel Driving School</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl" data-testid="text-student-name">
                    {studentData.firstName} {studentData.lastName}
                  </CardTitle>
                  <CardDescription className="font-mono text-base">
                    {studentData.studentCode}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={
                  studentData.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-gray-100 text-gray-700"
                }
              >
                {studentData.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{attendance.length}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{completedTraining}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {payments.filter((p: any) => p.status === "paid").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="training">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="training" data-testid="tab-training">
              <BookOpen className="h-4 w-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <Calendar className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Progress</CardTitle>
                <CardDescription>Your driving lesson history</CardDescription>
              </CardHeader>
              <CardContent>
                {trainingLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No training logs yet</p>
                ) : (
                  <div className="space-y-3">
                    {trainingLogs.map((log: any) => (
                      <div key={log.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-bold text-sm text-primary">D{log.day}</span>
                            </div>
                            <p className="font-medium">{log.topic || `Training Day ${log.day}`}</p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              log.studentProgress === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            }`}
                          >
                            {log.studentProgress?.replace("_", " ") || "In Progress"}
                          </span>
                        </div>
                        {log.notes && <p className="text-sm text-muted-foreground">{log.notes}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.sessionDate).toLocaleDateString()}
                          </span>
                          {log.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {log.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  {attendance.filter((a: any) => a.present).length} present out of {attendance.length}{" "}
                  sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No attendance records yet</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {record.present ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">{record.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{record.present ? "Present" : "Absent"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your payment records</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No payment records yet</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            payment.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Documents</CardTitle>
                <CardDescription>Your uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No documents uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
