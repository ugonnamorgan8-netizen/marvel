import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { authenticate, authorize, optionalAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import * as authController from "./controllers/authController";
import * as studentsController from "./controllers/studentsController";
import * as attendanceController from "./controllers/attendanceController";
import * as trainingController from "./controllers/trainingController";
import * as paymentsController from "./controllers/paymentsController";
import * as documentsController from "./controllers/documentsController";
import * as dashboardController from "./controllers/dashboardController";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { status: "error", message: "Too many requests, please try again later" }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: "error", message: "Too many login attempts, please try again later" }
  });

  app.use("/api", generalLimiter);

  app.get("/api/health", dashboardController.getHealthCheck);

  app.post("/api/auth/login", authLimiter, authController.login);
  app.post("/api/auth/viewer-login", authLimiter, authController.viewerLogin);
  app.post("/api/auth/refresh", authController.refreshToken);
  app.post("/api/auth/logout", authenticate, authController.logout);
  app.get("/api/auth/me", authenticate, authController.getMe);
  app.post("/api/auth/register", authenticate, authorize("admin"), authController.register);
  app.post("/api/auth/change-password", authenticate, authController.changePassword);

  app.get("/api/students", authenticate, authorize("admin", "staff"), studentsController.getStudents);
  app.get("/api/students/:id", authenticate, studentsController.getStudent);
  app.get("/api/students/code/:code", authenticate, studentsController.getStudentByCode);
  app.post("/api/students", authenticate, authorize("admin", "staff"), studentsController.createStudent);
  app.put("/api/students/:id", authenticate, authorize("admin", "staff"), studentsController.updateStudent);
  app.patch("/api/students/:id", authenticate, authorize("admin", "staff"), studentsController.updateStudent);
  app.delete("/api/students/:id", authenticate, authorize("admin"), studentsController.deleteStudent);

  app.get("/api/attendance", authenticate, authorize("admin", "staff"), attendanceController.getAttendance);
  app.get("/api/attendance/student/:studentId", authenticate, attendanceController.getStudentAttendance);
  app.post("/api/attendance", authenticate, authorize("admin", "staff"), attendanceController.createAttendance);
  app.post("/api/attendance/bulk", authenticate, authorize("admin", "staff"), attendanceController.createBulkAttendance);
  app.put("/api/attendance/:id", authenticate, authorize("admin", "staff"), attendanceController.updateAttendance);
  app.delete("/api/attendance/:id", authenticate, authorize("admin", "staff"), attendanceController.deleteAttendance);

  app.get("/api/training/:studentId", authenticate, trainingController.getTrainingLogs);
  app.get("/api/training/log/:id", authenticate, trainingController.getTrainingLog);
  app.get("/api/training/progress/:studentId", authenticate, trainingController.getStudentProgress);
  app.post("/api/training", authenticate, authorize("admin", "staff"), trainingController.createTrainingLog);
  app.put("/api/training/:id", authenticate, authorize("admin", "staff"), trainingController.updateTrainingLog);
  app.delete("/api/training/:id", authenticate, authorize("admin", "staff"), trainingController.deleteTrainingLog);

  app.get("/api/payments", authenticate, authorize("admin", "staff"), paymentsController.getPayments);
  app.get("/api/payments/:id", authenticate, paymentsController.getPayment);
  app.get("/api/payments/student/:studentId", authenticate, paymentsController.getStudentPayments);
  app.post("/api/payments/initiate", authenticate, authorize("admin", "staff"), paymentsController.initiatePayment);
  app.get("/api/payments/verify", paymentsController.verifyPayment);
  app.get("/api/payments/callback", paymentsController.paymentCallback);
  app.post("/api/payments/webhook", paymentsController.paymentWebhook);

  app.get("/api/documents/:studentId", authenticate, documentsController.getDocuments);
  app.get("/api/documents/single/:id", authenticate, documentsController.getDocument);
  app.post("/api/documents/upload", authenticate, authorize("admin", "staff"), documentsController.uploadMiddleware, documentsController.uploadDocument);
  app.get("/api/documents/signature", authenticate, authorize("admin", "staff"), documentsController.getUploadSignature);
  app.post("/api/documents/register", authenticate, authorize("admin", "staff"), documentsController.registerUpload);
  app.delete("/api/documents/:id", authenticate, authorize("admin", "staff"), documentsController.deleteDocument);

  app.get("/api/dashboard/stats", authenticate, authorize("admin", "staff"), dashboardController.getDashboardStats);
  app.get("/api/dashboard/recent-students", authenticate, authorize("admin", "staff"), dashboardController.getRecentStudents);
  app.get("/api/dashboard/recent-payments", authenticate, authorize("admin", "staff"), dashboardController.getRecentPayments);

  app.use(errorHandler);

  return httpServer;
}
