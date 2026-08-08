const multer = require("multer");
const path = require("path");

const ALLOWED_TYPES = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/zip",
  "application/x-rar-compressed",
  "text/",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ALLOWED_TYPES.some(
    (type) =>
      file.mimetype.startsWith(type) ||
      file.mimetype === type
  );

  if (allowed) {
    cb(null, true);
  } else {
    cb(
      new Error(`File type "${file.mimetype}" is not supported`),
      false
    );
  }
};

const upload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },

  fileFilter,
});

module.exports = upload;