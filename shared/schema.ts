import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, pgEnum, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "viewer"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const attendanceTypeEnum = pgEnum("attendance_type", ["theory", "practical", "test"]);
export const documentTypeEnum = pgEnum("document_type", ["passport", "id_card", "license", "certificate", "other"]);
export const studentStatusEnum = pgEnum("student_status", ["active", "inactive", "graduated", "suspended"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentCode: varchar("student_code", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  courseType: varchar("course_type", { length: 50 }).notNull().default("standard"),
  status: studentStatusEnum("status").notNull().default("active"),
  instructorId: integer("instructor_id"),
  enrollmentDate: date("enrollment_date").defaultNow(),
  expectedGraduationDate: date("expected_graduation_date"),
  notes: text("notes"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: attendanceTypeEnum("type").notNull(),
  present: boolean("present").notNull().default(true),
  notes: text("notes"),
  markedById: integer("marked_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  reference: varchar("reference", { length: 100 }).notNull().unique(),
  flutterwaveRef: varchar("flutterwave_ref", { length: 100 }),
  transactionId: varchar("transaction_id", { length: 100 }),
  paymentLink: text("payment_link"),
  description: text("description"),
  paidAt: timestamp("paid_at"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trainingLogs = pgTable("training_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  day: integer("day").notNull(),
  sessionDate: date("session_date").notNull(),
  duration: integer("duration"),
  topic: varchar("topic", { length: 255 }),
  notes: text("notes"),
  skillsCovered: text("skills_covered"),
  instructorComments: text("instructor_comments"),
  studentProgress: varchar("student_progress", { length: 50 }),
  instructorId: integer("instructor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  attendance: many(attendance),
  payments: many(payments),
  trainingLogs: many(trainingLogs),
}));

export const studentsRelations = relations(students, ({ many, one }) => ({
  documents: many(documents),
  attendance: many(attendance),
  payments: many(payments),
  trainingLogs: many(trainingLogs),
  instructor: one(users, {
    fields: [students.instructorId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  student: one(students, {
    fields: [documents.studentId],
    references: [students.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  markedBy: one(users, {
    fields: [attendance.markedById],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdById],
    references: [users.id],
  }),
}));

export const trainingLogsRelations = relations(trainingLogs, ({ one }) => ({
  student: one(students, {
    fields: [trainingLogs.studentId],
    references: [students.id],
  }),
  instructor: one(users, {
    fields: [trainingLogs.instructorId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  refreshToken: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  flutterwaveRef: true,
  transactionId: true,
  paymentLink: true,
});

export const insertTrainingLogSchema = createInsertSchema(trainingLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const viewerLoginSchema = z.object({
  studentCode: z.string().min(1, "Student code is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertTrainingLog = z.infer<typeof insertTrainingLogSchema>;
export type TrainingLog = typeof trainingLogs.$inferSelect;
