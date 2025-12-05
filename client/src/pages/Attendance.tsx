import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, CheckCircle, XCircle, Users } from "lucide-react";

export default function Attendance() {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMarkingOpen, setIsMarkingOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState("practical");
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, boolean>>({});

  const { data: studentsResponse, isLoading: studentsLoading } = useQuery<any>({
    queryKey: ["/api/students"],
  });

  const { data: attendanceResponse, isLoading: attendanceLoading } = useQuery<any>({
    queryKey: ["/api/attendance", { startDate: selectedDate, endDate: selectedDate }],
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/attendance/bulk", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setIsMarkingOpen(false);
      setAttendanceRecords({});
      toast({ title: "Success", description: "Attendance marked successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const students = studentsResponse?.data?.students || [];
  const attendanceList = attendanceResponse?.data?.attendance || [];

  const handleMarkAttendance = () => {
    const records = Object.entries(attendanceRecords).map(([studentId, present]) => ({
      studentId: parseInt(studentId),
      present,
    }));

    if (records.length === 0) {
      toast({ title: "Error", description: "Select at least one student", variant: "destructive" });
      return;
    }

    markAttendanceMutation.mutate({
      date: selectedDate,
      type: attendanceType,
      records,
    });
  };

  const toggleAttendance = (studentId: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === undefined ? true : !prev[studentId],
    }));
  };

  const selectAllPresent = () => {
    const allPresent: Record<number, boolean> = {};
    students.forEach((s: any) => {
      allPresent[s.id] = true;
    });
    setAttendanceRecords(allPresent);
  };

  const presentCount = attendanceList.filter((a: any) => a.present).length;
  const absentCount = attendanceList.filter((a: any) => !a.present).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track student attendance for classes and sessions</p>
        </div>

        <Dialog open={isMarkingOpen} onOpenChange={setIsMarkingOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-mark-attendance">
              <Plus className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>
                Select students who are present for today's session
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    data-testid="input-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <Select value={attendanceType} onValueChange={setAttendanceType}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theory">Theory</SelectItem>
                      <SelectItem value="practical">Practical</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Label>Students</Label>
                <Button variant="outline" size="sm" onClick={selectAllPresent}>
                  Select All Present
                </Button>
              </div>

              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No active students</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {students
                    .filter((s: any) => s.status === "active")
                    .map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={attendanceRecords[student.id] || false}
                          onCheckedChange={() => toggleAttendance(student.id)}
                          data-testid={`checkbox-student-${student.id}`}
                        />
                        <label
                          htmlFor={`student-${student.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {student.studentCode}
                          </p>
                        </label>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMarkingOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAttendance}
                  disabled={markAttendanceMutation.isPending}
                  data-testid="button-submit-attendance"
                >
                  {markAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total">
              {attendanceList.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">For selected date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-present">
              {presentCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-absent">
              {absentCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students absent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Viewing records for {new Date(selectedDate).toLocaleDateString()}</CardDescription>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
              data-testid="input-filter-date"
            />
          </div>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : attendanceList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No attendance records</h3>
              <p className="text-muted-foreground">
                No attendance has been marked for this date
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceList.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  data-testid={`attendance-row-${record.id}`}
                >
                  <div className="flex items-center gap-3">
                    {record.present ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Student ID: {record.studentId}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {record.type} session
                      </p>
                    </div>
                  </div>
                  <Badge variant={record.present ? "default" : "destructive"}>
                    {record.present ? "Present" : "Absent"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
