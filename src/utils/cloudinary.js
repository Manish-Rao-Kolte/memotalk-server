import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: "dbbido0zq",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//utility function to upload file on cloudinary storage.
const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) {
            return null;
        }
        const uploadedInstance = await cloudinary.uploader.upload(filePath, {
            resource_type: "raw",
        });
        return uploadedInstance;
    } catch (error) {
        fs.unlinkSync(filePath); //removes temporary files stored via multer.
        console.log(error);
        return error;
    }
};

//utility function to remove file from cloudinary storage.
const removeFromCloudinary = async (id) => {
    try {
        const res = await cloudinary.uploader.destroy(id, {
            invalidate: true,
            resource_type: "raw",
        });
        return res.result;
    } catch (error) {
        return null;
    }
};

export { uploadOnCloudinary, removeFromCloudinary };
