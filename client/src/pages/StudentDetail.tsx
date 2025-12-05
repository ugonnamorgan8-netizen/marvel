import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: response, isLoading } = useQuery<any>({
    queryKey: ["/api/students", id],
  });

  const student = response?.data?.student;
  const documents = response?.data?.documents || [];
  const attendance = response?.data?.attendance || [];
  const payments = response?.data?.payments || [];
  const trainingLogs = response?.data?.trainingLogs || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Student not found</h2>
        <Button variant="link" onClick={() => setLocation("/students")}>
          Back to Students
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "graduated":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "suspended":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation("/students")}
        className="mb-2"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Students
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl" data-testid="text-student-name">
                  {student.firstName} {student.lastName}
                </CardTitle>
                <CardDescription className="font-mono text-base">
                  {student.studentCode}
                </CardDescription>
              </div>
            </div>
            <Badge className={getStatusColor(student.status)} variant="secondary">
              {student.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {student.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{student.phone}</span>
              </div>
            )}
            {student.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{student.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Enrolled: {new Date(student.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="attendance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance" data-testid="tab-attendance">
            <Calendar className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">
            <BookOpen className="h-4 w-4 mr-2" />
            Training
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

        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {attendance.filter((a: any) => a.present).length} present out of {attendance.length} sessions
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
                      data-testid={`attendance-row-${record.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {record.present ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
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

        <TabsContent value="training" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Logs</CardTitle>
              <CardDescription>{trainingLogs.length} training sessions recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {trainingLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No training logs yet</p>
              ) : (
                <div className="space-y-3">
                  {trainingLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-4 bg-muted/50 rounded-lg"
                      data-testid={`training-row-${log.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Day {log.day}</p>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.sessionDate).toLocaleDateString()}
                        </span>
                      </div>
                      {log.topic && <p className="text-sm mb-1"><strong>Topic:</strong> {log.topic}</p>}
                      {log.notes && <p className="text-sm text-muted-foreground">{log.notes}</p>}
                      {log.duration && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.duration} minutes
                        </p>
                      )}
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
              <CardDescription>
                {payments.filter((p: any) => p.status === "paid").length} paid, {payments.filter((p: any) => p.status === "pending").length} pending
              </CardDescription>
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
                      data-testid={`payment-row-${payment.id}`}
                    >
                      <div>
                        <p className="font-medium">
                          {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">{payment.reference}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          payment.status === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
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
              <CardTitle>Documents</CardTitle>
              <CardDescription>{documents.length} documents uploaded</CardDescription>
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
                      data-testid={`document-row-${doc.id}`}
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
    </div>
  );
}
