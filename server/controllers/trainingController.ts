import { Request, Response } from "express";
import { storage } from "../storage";
import { insertTrainingLogSchema } from "@shared/schema";
import { asyncHandler, NotFoundError } from "../middleware/errorHandler";

export const getTrainingLogs = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const logs = await storage.getTrainingLogs(parseInt(studentId));

  res.json({
    status: "success",
    data: { trainingLogs: logs }
  });
});

export const getTrainingLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const log = await storage.getTrainingLog(parseInt(id));

  if (!log) {
    throw new NotFoundError("Training log");
  }

  res.json({
    status: "success",
    data: { trainingLog: log }
  });
});

export const createTrainingLog = asyncHandler(async (req: Request, res: Response) => {
  const data = insertTrainingLogSchema.parse(req.body);

  const student = await storage.getStudent(data.studentId);
  if (!student) {
    throw new NotFoundError("Student");
  }

  if (req.user) {
    data.instructorId = req.user.userId;
  }

  const log = await storage.createTrainingLog(data);

  res.status(201).json({
    status: "success",
    data: { trainingLog: log }
  });
});

export const updateTrainingLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const logId = parseInt(id);

  const existing = await storage.getTrainingLog(logId);
  if (!existing) {
    throw new NotFoundError("Training log");
  }

  const data = insertTrainingLogSchema.partial().parse(req.body);
  const log = await storage.updateTrainingLog(logId, data);

  res.json({
    status: "success",
    data: { trainingLog: log }
  });
});

export const deleteTrainingLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await storage.deleteTrainingLog(parseInt(id));

  if (!deleted) {
    throw new NotFoundError("Training log");
  }

  res.json({
    status: "success",
    message: "Training log deleted successfully"
  });
});

export const getStudentProgress = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const student = await storage.getStudent(parseInt(studentId));

  if (!student) {
    throw new NotFoundError("Student");
  }

  const logs = await storage.getTrainingLogs(parseInt(studentId));

  const totalDays = logs.length;
  const completedDays = logs.filter(l => l.studentProgress === "completed").length;
  const totalDuration = logs.reduce((sum, l) => sum + (l.duration || 0), 0);

  res.json({
    status: "success",
    data: {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        studentCode: student.studentCode
      },
      progress: {
        totalDays,
        completedDays,
        totalDurationMinutes: totalDuration,
        completionPercentage: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
      },
      logs
    }
  });
});
