import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Clock, Calendar, User } from "lucide-react";

export default function Training() {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newLog, setNewLog] = useState({
    studentId: "",
    day: 1,
    sessionDate: new Date().toISOString().split("T")[0],
    duration: 60,
    topic: "",
    notes: "",
    skillsCovered: "",
    studentProgress: "in_progress",
  });

  const { data: studentsResponse, isLoading: studentsLoading } = useQuery<any>({
    queryKey: ["/api/students"],
  });

  const { data: trainingResponse, isLoading: trainingLoading } = useQuery<any>({
    queryKey: ["/api/training", selectedStudent],
    enabled: !!selectedStudent,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/training", {
        ...data,
        studentId: parseInt(data.studentId),
        day: parseInt(data.day),
        duration: parseInt(data.duration),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training"] });
      setIsAddDialogOpen(false);
      setNewLog({
        studentId: "",
        day: 1,
        sessionDate: new Date().toISOString().split("T")[0],
        duration: 60,
        topic: "",
        notes: "",
        skillsCovered: "",
        studentProgress: "in_progress",
      });
      toast({ title: "Success", description: "Training log added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const students = studentsResponse?.data?.students || [];
  const trainingLogs = trainingResponse?.data?.trainingLogs || [];

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newLog);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Training Logs</h1>
          <p className="text-muted-foreground mt-1">Track student training progress and sessions</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-log">
              <Plus className="h-4 w-4 mr-2" />
              Add Training Log
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Training Log</DialogTitle>
              <DialogDescription>Record a new training session for a student</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={newLog.studentId}
                  onValueChange={(value) => setNewLog({ ...newLog, studentId: value })}
                >
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter((s: any) => s.status === "active")
                      .map((student: any) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName} ({student.studentCode})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Day Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newLog.day}
                    onChange={(e) => setNewLog({ ...newLog, day: parseInt(e.target.value) || 1 })}
                    data-testid="input-day"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Date</Label>
                  <Input
                    type="date"
                    value={newLog.sessionDate}
                    onChange={(e) => setNewLog({ ...newLog, sessionDate: e.target.value })}
                    data-testid="input-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newLog.duration}
                    onChange={(e) => setNewLog({ ...newLog, duration: parseInt(e.target.value) || 60 })}
                    data-testid="input-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Progress</Label>
                  <Select
                    value={newLog.studentProgress}
                    onValueChange={(value) => setNewLog({ ...newLog, studentProgress: value })}
                  >
                    <SelectTrigger data-testid="select-progress">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="needs_review">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  value={newLog.topic}
                  onChange={(e) => setNewLog({ ...newLog, topic: e.target.value })}
                  placeholder="e.g., Parallel parking, Highway driving"
                  data-testid="input-topic"
                />
              </div>

              <div className="space-y-2">
                <Label>Skills Covered</Label>
                <Input
                  value={newLog.skillsCovered}
                  onChange={(e) => setNewLog({ ...newLog, skillsCovered: e.target.value })}
                  placeholder="e.g., Lane changing, Mirror checking"
                  data-testid="input-skills"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  placeholder="Session notes and observations..."
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-log">
                  {createMutation.isPending ? "Adding..." : "Add Log"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Training Progress</CardTitle>
              <CardDescription>Select a student to view their training logs</CardDescription>
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full sm:w-64" data-testid="select-filter-student">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedStudent ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a Student</h3>
              <p className="text-muted-foreground">
                Choose a student from the dropdown to view their training logs
              </p>
            </div>
          ) : trainingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : trainingLogs.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Training Logs</h3>
              <p className="text-muted-foreground">
                No training sessions have been recorded for this student
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trainingLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-4 bg-muted/50 rounded-lg"
                  data-testid={`training-row-${log.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">D{log.day}</span>
                      </div>
                      <div>
                        <p className="font-medium">{log.topic || `Training Day ${log.day}`}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        log.studentProgress === "completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : log.studentProgress === "needs_review"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}
                    >
                      {log.studentProgress?.replace("_", " ") || "In Progress"}
                    </span>
                  </div>

                  {log.skillsCovered && (
                    <p className="text-sm mb-2">
                      <strong>Skills:</strong> {log.skillsCovered}
                    </p>
                  )}

                  {log.notes && (
                    <p className="text-sm text-muted-foreground">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
