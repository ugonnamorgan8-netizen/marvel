import { Request, Response } from "express";
import { storage } from "../storage";
import { insertAttendanceSchema } from "@shared/schema";
import { asyncHandler, NotFoundError } from "../middleware/errorHandler";

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, startDate, endDate, type } = req.query;

  const records = await storage.getAttendance({
    studentId: studentId ? parseInt(studentId as string) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    type: type as string
  });

  res.json({
    status: "success",
    data: { attendance: records }
  });
});

export const createAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = insertAttendanceSchema.parse(req.body);

  const student = await storage.getStudent(data.studentId);
  if (!student) {
    throw new NotFoundError("Student");
  }

  if (req.user) {
    data.markedById = req.user.userId;
  }

  const record = await storage.createAttendance(data);

  res.status(201).json({
    status: "success",
    data: { attendance: record }
  });
});

export const createBulkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { date, type, records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({
      status: "error",
      message: "Records array is required"
    });
    return;
  }

  const createdRecords = [];

  for (const record of records) {
    const data = insertAttendanceSchema.parse({
      studentId: record.studentId,
      date,
      type,
      present: record.present ?? true,
      notes: record.notes,
      markedById: req.user?.userId
    });

    const student = await storage.getStudent(data.studentId);
    if (student) {
      const created = await storage.createAttendance(data);
      createdRecords.push(created);
    }
  }

  res.status(201).json({
    status: "success",
    data: { 
      count: createdRecords.length,
      attendance: createdRecords 
    }
  });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const attendanceId = parseInt(id);

  const data = insertAttendanceSchema.partial().parse(req.body);
  const record = await storage.updateAttendance(attendanceId, data);

  if (!record) {
    throw new NotFoundError("Attendance record");
  }

  res.json({
    status: "success",
    data: { attendance: record }
  });
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await storage.deleteAttendance(parseInt(id));

  if (!deleted) {
    throw new NotFoundError("Attendance record");
  }

  res.json({
    status: "success",
    message: "Attendance record deleted successfully"
  });
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { startDate, endDate, type } = req.query;

  const records = await storage.getAttendance({
    studentId: parseInt(studentId),
    startDate: startDate as string,
    endDate: endDate as string,
    type: type as string
  });

  const summary = {
    total: records.length,
    present: records.filter(r => r.present).length,
    absent: records.filter(r => !r.present).length,
    theory: records.filter(r => r.type === "theory").length,
    practical: records.filter(r => r.type === "practical").length,
    test: records.filter(r => r.type === "test").length
  };

  res.json({
    status: "success",
    data: { 
      attendance: records,
      summary
    }
  });
});
