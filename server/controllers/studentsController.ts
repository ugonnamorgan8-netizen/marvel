import { Request, Response } from "express";
import { storage } from "../storage";
import { insertStudentSchema } from "@shared/schema";
import { asyncHandler, NotFoundError, ConflictError } from "../middleware/errorHandler";

function generateStudentCode(): string {
  const prefix = "MDS";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${year}${random}`;
}

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, limit, offset } = req.query;

  const result = await storage.getStudents({
    status: status as string,
    search: search as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined
  });

  res.json({
    status: "success",
    data: result
  });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const student = await storage.getStudent(parseInt(id));

  if (!student) {
    throw new NotFoundError("Student");
  }

  const [documents, attendanceRecords, payments, trainingLogs] = await Promise.all([
    storage.getDocuments(student.id),
    storage.getAttendance({ studentId: student.id }),
    storage.getPayments({ studentId: student.id }),
    storage.getTrainingLogs(student.id)
  ]);

  res.json({
    status: "success",
    data: {
      student,
      documents,
      attendance: attendanceRecords,
      payments,
      trainingLogs
    }
  });
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const data = insertStudentSchema.parse(req.body);

  if (!data.studentCode) {
    data.studentCode = generateStudentCode();
  }

  const existing = await storage.getStudentByCode(data.studentCode);
  if (existing) {
    throw new ConflictError("Student code already exists");
  }

  const student = await storage.createStudent(data);

  res.status(201).json({
    status: "success",
    data: { student }
  });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const studentId = parseInt(id);

  const existing = await storage.getStudent(studentId);
  if (!existing) {
    throw new NotFoundError("Student");
  }

  const data = insertStudentSchema.partial().parse(req.body);

  if (data.studentCode && data.studentCode !== existing.studentCode) {
    const codeExists = await storage.getStudentByCode(data.studentCode);
    if (codeExists) {
      throw new ConflictError("Student code already exists");
    }
  }

  const student = await storage.updateStudent(studentId, data);

  res.json({
    status: "success",
    data: { student }
  });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const studentId = parseInt(id);

  const existing = await storage.getStudent(studentId);
  if (!existing) {
    throw new NotFoundError("Student");
  }

  await storage.deleteStudent(studentId);

  res.json({
    status: "success",
    message: "Student deleted successfully"
  });
});

export const getStudentByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const student = await storage.getStudentByCode(code);

  if (!student) {
    throw new NotFoundError("Student");
  }

  res.json({
    status: "success",
    data: { student }
  });
});
