import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  imageBuffer: Buffer,
  folder: string = "pinterest-pins",
  publicId?: string
): Promise<string | null> {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          format: "jpg",
          transformation: [
            { quality: "auto:best", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload failed:", error);
            resolve(null);
          } else {
            resolve(result?.secure_url || null);
          }
        }
      );

      uploadStream.end(imageBuffer);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}
