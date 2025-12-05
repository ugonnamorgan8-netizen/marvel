import { Request, Response } from "express";
import { storage } from "../storage";
import { asyncHandler } from "../middleware/errorHandler";

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await storage.getDashboardStats();

  res.json({
    status: "success",
    data: { stats }
  });
});

export const getRecentStudents = asyncHandler(async (req: Request, res: Response) => {
  const { students } = await storage.getStudents({ limit: 5 });

  res.json({
    status: "success",
    data: { students }
  });
});

export const getRecentPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await storage.getPayments({});
  const recentPayments = payments.slice(0, 5);

  const enrichedPayments = await Promise.all(
    recentPayments.map(async (payment) => {
      const student = await storage.getStudent(payment.studentId);
      return {
        ...payment,
        studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown"
      };
    })
  );

  res.json({
    status: "success",
    data: { payments: enrichedPayments }
  });
});

export const getHealthCheck = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "Marvel Driving School API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});
