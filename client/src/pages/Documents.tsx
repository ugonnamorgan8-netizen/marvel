import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { FileText, Upload, ExternalLink, Trash2, User, File, Image } from "lucide-react";

export default function Documents() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadData, setUploadData] = useState({
    studentId: "",
    type: "other",
    name: "",
  });

  const { data: studentsResponse } = useQuery<any>({
    queryKey: ["/api/students"],
  });

  const { data: documentsResponse, isLoading } = useQuery<any>({
    queryKey: ["/api/documents", selectedStudent],
    enabled: !!selectedStudent,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("marvel_auth");
      const parsed = token ? JSON.parse(token) : {};

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${parsed.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({ studentId: "", type: "other", name: "" });
      toast({ title: "Success", description: "Document uploaded successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("marvel_auth");
      const parsed = token ? JSON.parse(token) : {};

      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${parsed.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Success", description: "Document deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const students = studentsResponse?.data?.students || [];
  const documents = documentsResponse?.data?.documents || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadData.name) {
        setUploadData({ ...uploadData, name: file.name });
      }
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !uploadData.studentId) {
      toast({ title: "Error", description: "Please select a file and student", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("studentId", uploadData.studentId);
    formData.append("type", uploadData.type);
    formData.append("name", uploadData.name || selectedFile.name);

    uploadMutation.mutate(formData);
  };

  const getFileIcon = (mimeType: string | null) => {
    if (mimeType?.startsWith("image/")) {
      return <Image className="h-8 w-8 text-blue-600" />;
    }
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage student documents and files</p>
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-document">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Upload a document for a student</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={uploadData.studentId}
                  onValueChange={(value) => setUploadData({ ...uploadData, studentId: value })}
                >
                  <SelectTrigger data-testid="select-student">
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

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={uploadData.type}
                  onValueChange={(value) => setUploadData({ ...uploadData, type: value })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="id_card">ID Card</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  placeholder="Enter document name"
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label>File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {selectedFile ? (
                    <div>
                      <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Click to select a file</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images, PDF, DOC up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadMutation.isPending} data-testid="button-submit-upload">
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
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
              <CardTitle>Student Documents</CardTitle>
              <CardDescription>Select a student to view their documents</CardDescription>
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
                Choose a student from the dropdown to view their documents
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Documents</h3>
              <p className="text-muted-foreground">
                No documents have been uploaded for this student
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 bg-muted/50 rounded-lg"
                  data-testid={`document-row-${doc.id}`}
                >
                  <div className="flex items-start gap-3">
                    {getFileIcon(doc.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                      {doc.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
