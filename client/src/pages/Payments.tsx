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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";

export default function Payments() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newPayment, setNewPayment] = useState({
    studentId: "",
    amount: "",
    currency: "NGN",
    description: "",
  });

  const { data: studentsResponse } = useQuery<any>({
    queryKey: ["/api/students"],
  });

  const { data: paymentsResponse, isLoading } = useQuery<any>({
    queryKey: ["/api/payments", { status: statusFilter === "all" ? "" : statusFilter }],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/payments/initiate", {
        ...data,
        studentId: parseInt(data.studentId),
        amount: parseFloat(data.amount),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setIsAddDialogOpen(false);
      setNewPayment({ studentId: "", amount: "", currency: "NGN", description: "" });
      toast({ title: "Success", description: "Payment initiated successfully" });

      if (response?.data?.payment?.paymentLink) {
        window.open(response.data.payment.paymentLink, "_blank");
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const students = studentsResponse?.data?.students || [];
  const payments = paymentsResponse?.data?.payments || [];

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newPayment);
  };

  const filteredPayments = payments.filter((payment: any) => {
    if (statusFilter === "all") return true;
    return payment.status === statusFilter;
  });

  const totalPaid = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  const totalPending = payments
    .filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Payments</h1>
          <p className="text-muted-foreground mt-1">Manage student payments and invoices</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-initiate-payment">
              <Plus className="h-4 w-4 mr-2" />
              Initiate Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Initiate Payment</DialogTitle>
              <DialogDescription>Create a new payment request for a student</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={newPayment.studentId}
                  onValueChange={(value) => setNewPayment({ ...newPayment, studentId: value })}
                >
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} ({student.studentCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    data-testid="input-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={newPayment.currency}
                    onValueChange={(value) => setNewPayment({ ...newPayment, currency: value })}
                  >
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                  placeholder="Payment for driving lessons..."
                  rows={2}
                  data-testid="input-description"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-payment">
                  {createMutation.isPending ? "Creating..." : "Create Payment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-paid">
              NGN {totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-pending">
              NGN {totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-invoices">
              {payments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>View and manage all payment transactions</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No payments found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== "all"
                  ? "Try changing the status filter"
                  : "Create your first payment to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  data-testid={`payment-row-${payment.id}`}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">
                        {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">{payment.reference}</p>
                      {payment.description && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                    {payment.paymentLink && payment.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(payment.paymentLink, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    )}
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
