import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type JWTPayload
} from "../middleware/auth";
import { loginSchema, viewerLoginSchema } from "@shared/schema";
import { asyncHandler, BadRequestError, UnauthorizedError } from "../middleware/errorHandler";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("Account is deactivated");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await storage.updateUserRefreshToken(user.id, refreshToken);

  res.json({
    status: "success",
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});

export const viewerLogin = asyncHandler(async (req: Request, res: Response) => {
  const { studentCode } = viewerLoginSchema.parse(req.body);

  const student = await storage.getStudentByCode(studentCode);
  if (!student) {
    throw new UnauthorizedError("Invalid student code");
  }

  if (student.status !== "active") {
    throw new UnauthorizedError("Student account is not active");
  }

  const payload: JWTPayload = {
    userId: 0,
    email: student.email || "",
    role: "viewer",
    studentId: student.id
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.json({
    status: "success",
    data: {
      student: {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName
      },
      accessToken,
      refreshToken
    }
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new BadRequestError("Refresh token is required");
  }

  const decoded = verifyRefreshToken(token);

  if (decoded.role === "viewer") {
    const newAccessToken = generateAccessToken(decoded);
    res.json({
      status: "success",
      data: { accessToken: newAccessToken }
    });
    return;
  }

  const user = await storage.getUser(decoded.userId);
  if (!user || user.refreshToken !== token) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  await storage.updateUserRefreshToken(user.id, newRefreshToken);

  res.json({
    status: "success",
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user && req.user.userId) {
    await storage.updateUserRefreshToken(req.user.userId, null);
  }

  res.json({
    status: "success",
    message: "Logged out successfully"
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError("Not authenticated");
  }

  if (req.user.role === "viewer" && req.user.studentId) {
    const student = await storage.getStudent(req.user.studentId);
    res.json({
      status: "success",
      data: {
        type: "student",
        student
      }
    });
    return;
  }

  const user = await storage.getUser(req.user.userId);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  res.json({
    status: "success",
    data: {
      type: "user",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body;

  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new BadRequestError("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await storage.createUser({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: role || "staff",
    isActive: true
  });

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!req.user) {
    throw new UnauthorizedError("Not authenticated");
  }

  const user = await storage.getUser(req.user.userId);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new BadRequestError("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await storage.updateUser(user.id, { password: hashedPassword });

  res.json({
    status: "success",
    message: "Password changed successfully"
  });
});
