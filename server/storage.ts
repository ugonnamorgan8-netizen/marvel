import {
  users, students, documents, attendance, payments, trainingLogs,
  type User, type InsertUser,
  type Student, type InsertStudent,
  type Document, type InsertDocument,
  type Attendance, type InsertAttendance,
  type Payment, type InsertPayment,
  type TrainingLog, type InsertTrainingLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserRefreshToken(id: number, refreshToken: string | null): Promise<void>;

  getStudents(filters?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<{ students: Student[]; total: number }>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByCode(code: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, data: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  getDocuments(studentId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;

  getAttendance(filters?: { studentId?: number; startDate?: string; endDate?: string; type?: string }): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  getPayments(filters?: { studentId?: number; status?: string }): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByReference(reference: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, data: Partial<Payment>): Promise<Payment | undefined>;

  getTrainingLogs(studentId: number): Promise<TrainingLog[]>;
  getTrainingLog(id: number): Promise<TrainingLog | undefined>;
  createTrainingLog(log: InsertTrainingLog): Promise<TrainingLog>;
  updateTrainingLog(id: number, data: Partial<InsertTrainingLog>): Promise<TrainingLog | undefined>;
  deleteTrainingLog(id: number): Promise<boolean>;

  getDashboardStats(): Promise<{
    totalStudents: number;
    activeStudents: number;
    pendingPayments: number;
    todayAttendance: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserRefreshToken(id: number, refreshToken: string | null): Promise<void> {
    await db.update(users).set({ refreshToken }).where(eq(users.id, id));
  }

  async getStudents(filters?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<{ students: Student[]; total: number }> {
    const MAX_LIMIT = 100;
    const limit = Math.min(filters?.limit || 50, MAX_LIMIT);
    const offset = Math.max(filters?.offset || 0, 0);
    
    let conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(students.status, filters.status as any));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(students.firstName, searchPattern),
          like(students.lastName, searchPattern),
          like(students.studentCode, searchPattern),
          like(students.email || "", searchPattern),
          like(students.phone, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [studentsList, countResult] = await Promise.all([
      db
        .select()
        .from(students)
        .where(whereClause)
        .orderBy(desc(students.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(students)
        .where(whereClause)
    ]);

    return {
      students: studentsList,
      total: Number(countResult[0]?.count || 0)
    };
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByCode(code: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentCode, code));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: number, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return student || undefined;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  async getDocuments(studentId: number): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.studentId, studentId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc || undefined;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(doc).returning();
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  async getAttendance(filters?: { studentId?: number; startDate?: string; endDate?: string; type?: string }): Promise<Attendance[]> {
    let conditions: any[] = [];

    if (filters?.studentId) {
      conditions.push(eq(attendance.studentId, filters.studentId));
    }
    if (filters?.startDate) {
      conditions.push(gte(attendance.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(attendance.date, filters.endDate));
    }
    if (filters?.type) {
      conditions.push(eq(attendance.type, filters.type as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(attendance)
      .where(whereClause)
      .orderBy(desc(attendance.date));
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(insertAttendance).returning();
    return record;
  }

  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [record] = await db
      .update(attendance)
      .set(data)
      .where(eq(attendance.id, id))
      .returning();
    return record || undefined;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    const result = await db.delete(attendance).where(eq(attendance.id, id)).returning();
    return result.length > 0;
  }

  async getPayments(filters?: { studentId?: number; status?: string }): Promise<Payment[]> {
    let conditions: any[] = [];

    if (filters?.studentId) {
      conditions.push(eq(payments.studentId, filters.studentId));
    }
    if (filters?.status) {
      conditions.push(eq(payments.status, filters.status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(payments)
      .where(whereClause)
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByReference(reference: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.reference, reference));
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePayment(id: number, data: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async getTrainingLogs(studentId: number): Promise<TrainingLog[]> {
    return db
      .select()
      .from(trainingLogs)
      .where(eq(trainingLogs.studentId, studentId))
      .orderBy(trainingLogs.day);
  }

  async getTrainingLog(id: number): Promise<TrainingLog | undefined> {
    const [log] = await db.select().from(trainingLogs).where(eq(trainingLogs.id, id));
    return log || undefined;
  }

  async createTrainingLog(insertLog: InsertTrainingLog): Promise<TrainingLog> {
    const [log] = await db.insert(trainingLogs).values(insertLog).returning();
    return log;
  }

  async updateTrainingLog(id: number, data: Partial<InsertTrainingLog>): Promise<TrainingLog | undefined> {
    const [log] = await db
      .update(trainingLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(trainingLogs.id, id))
      .returning();
    return log || undefined;
  }

  async deleteTrainingLog(id: number): Promise<boolean> {
    const result = await db.delete(trainingLogs).where(eq(trainingLogs.id, id)).returning();
    return result.length > 0;
  }

  async getDashboardStats(): Promise<{
    totalStudents: number;
    activeStudents: number;
    pendingPayments: number;
    todayAttendance: number;
  }> {
    const today = new Date().toISOString().split("T")[0];

    const [totalResult, activeResult, pendingResult, attendanceResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(students),
      db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(attendance).where(and(eq(attendance.date, today), eq(attendance.present, true)))
    ]);

    return {
      totalStudents: Number(totalResult[0]?.count || 0),
      activeStudents: Number(activeResult[0]?.count || 0),
      pendingPayments: Number(pendingResult[0]?.count || 0),
      todayAttendance: Number(attendanceResult[0]?.count || 0)
    };
  }
}

export const storage = new DatabaseStorage();
