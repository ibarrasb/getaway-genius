
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getExistingCloudinaryUrl(publicId) {
  try {
    const resource = await cloudinary.api.resource(`getawaygenius/places/${publicId}`);
    return resource.secure_url;
  } catch (error) {
    if (error?.http_code === 404) {
      return null;
    }
    throw error;
  }
}

export async function uploadImageBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'getawaygenius/places',
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export default cloudinary;
