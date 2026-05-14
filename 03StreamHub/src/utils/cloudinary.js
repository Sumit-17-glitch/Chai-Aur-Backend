import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadFileToCloudinary = async (localFilePath) => {
  // configure cloudinary with credentials
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {

    if (!localFilePath) return null;

    // upload file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response || response;

  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the file from local server as the upload operation gto failed
    return error;

  }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  try {

    if (!publicId) return null;

    // delete from cloudinary
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return response;

  } catch (error) {
    return error;
  }
}

export { uploadFileToCloudinary, deleteFromCloudinary };
