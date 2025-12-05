import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users, students } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

function getJWTSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable must be set");
  }
  return JWT_SECRET;
}

function getJWTRefreshSecret(): string {
  if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET environment variable must be set");
  }
  return JWT_REFRESH_SECRET;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: "admin" | "staff" | "viewer";
  studentId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: "15m" });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJWTRefreshSecret(), { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, getJWTSecret()) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, getJWTRefreshSecret()) as JWTPayload;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user || !user.isActive) {
      res.status(401).json({ message: "User not found or inactive" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    res.status(401).json({ message: "Invalid token" });
  }
}

export function authorize(...allowedRoles: ("admin" | "staff" | "viewer")[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export async function authenticateViewer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (decoded.role !== "viewer" || !decoded.studentId) {
      res.status(403).json({ message: "Invalid viewer token" });
      return;
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, decoded.studentId));

    if (!student) {
      res.status(401).json({ message: "Student not found" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    res.status(401).json({ message: "Invalid token" });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    next();
  }
}
