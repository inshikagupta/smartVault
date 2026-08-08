const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

function getResourceType(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "raw"; // PDFs, docs, zips, etc.
}
async function uploadFileToCloud(file) {
  try {
    const resourceType = getResourceType(file.mimetype);
    const uploadOptions = {
      resource_type: resourceType,
      folder: `smart-drive/${resourceType}s`,
      use_filename: true,
      unique_filename: true,
    };

    if (resourceType === "image") {
      uploadOptions.auto_tagging = 0.7;
      uploadOptions.categorization = "aws_rek_tagging";
    }

    const result = await cloudinary.uploader.upload(
      file.path,
      uploadOptions
    );

    return result;

  } catch (error) {
    console.error("[uploadFileToCloud]", error);
    throw error;
  }
}

module.exports = { uploadFileToCloud };
