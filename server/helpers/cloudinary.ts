import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "image" | "raw" | "auto";
    publicId?: string;
  } = {}
): Promise<UploadResult> {
  const { folder = "marvel-driving-school", resourceType = "auto", publicId } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error("Cloudinary upload returned no result"));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
}

export function generateSignedUploadUrl(options: {
  folder?: string;
  publicId?: string;
  resourceType?: string;
  expiresAt?: number;
} = {}): { signature: string; timestamp: number; apiKey: string; cloudName: string } {
  const timestamp = Math.round(Date.now() / 1000);
  const expiresAt = options.expiresAt || timestamp + 3600;

  const params: Record<string, any> = {
    timestamp,
    folder: options.folder || "marvel-driving-school",
  };

  if (options.publicId) {
    params.public_id = options.publicId;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET || ""
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  };
}

export default cloudinary;
