import { Request, Response } from "express";
import multer from "multer";
import { storage } from "../storage";
import { insertDocumentSchema } from "@shared/schema";
import { uploadToCloudinary, deleteFromCloudinary, generateSignedUploadUrl } from "../helpers/cloudinary";
import { asyncHandler, NotFoundError, BadRequestError } from "../middleware/errorHandler";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

export const uploadMiddleware = upload.single("file");

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const documents = await storage.getDocuments(parseInt(studentId));

  res.json({
    status: "success",
    data: { documents }
  });
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const document = await storage.getDocument(parseInt(id));

  if (!document) {
    throw new NotFoundError("Document");
  }

  res.json({
    status: "success",
    data: { document }
  });
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("No file uploaded");
  }

  const { studentId, type, name } = req.body;

  if (!studentId || !type) {
    throw new BadRequestError("Student ID and document type are required");
  }

  const student = await storage.getStudent(parseInt(studentId));
  if (!student) {
    throw new NotFoundError("Student");
  }

  const uploadResult = await uploadToCloudinary(req.file.buffer, {
    folder: `marvel-driving-school/students/${studentId}`,
    resourceType: req.file.mimetype.startsWith("image/") ? "image" : "raw"
  });

  const documentData = insertDocumentSchema.parse({
    studentId: parseInt(studentId),
    type,
    name: name || req.file.originalname,
    url: uploadResult.url,
    cloudinaryPublicId: uploadResult.publicId,
    fileSize: uploadResult.bytes,
    mimeType: req.file.mimetype,
    uploadedById: req.user?.userId
  });

  const document = await storage.createDocument(documentData);

  res.status(201).json({
    status: "success",
    data: { document }
  });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const document = await storage.getDocument(parseInt(id));

  if (!document) {
    throw new NotFoundError("Document");
  }

  if (document.cloudinaryPublicId) {
    try {
      await deleteFromCloudinary(document.cloudinaryPublicId);
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error);
    }
  }

  await storage.deleteDocument(parseInt(id));

  res.json({
    status: "success",
    message: "Document deleted successfully"
  });
});

export const getUploadSignature = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, folder } = req.query;

  const uploadParams = generateSignedUploadUrl({
    folder: folder as string || `marvel-driving-school/students/${studentId || "general"}`
  });

  res.json({
    status: "success",
    data: uploadParams
  });
});

export const registerUpload = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, type, name, url, publicId, fileSize, mimeType } = req.body;

  if (!studentId || !type || !url) {
    throw new BadRequestError("Student ID, type, and URL are required");
  }

  const student = await storage.getStudent(parseInt(studentId));
  if (!student) {
    throw new NotFoundError("Student");
  }

  const documentData = insertDocumentSchema.parse({
    studentId: parseInt(studentId),
    type,
    name: name || "Uploaded document",
    url,
    cloudinaryPublicId: publicId,
    fileSize: fileSize ? parseInt(fileSize) : null,
    mimeType,
    uploadedById: req.user?.userId
  });

  const document = await storage.createDocument(documentData);

  res.status(201).json({
    status: "success",
    data: { document }
  });
});
