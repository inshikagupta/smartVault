const crypto = require("crypto");
const File = require("../models/file.model");
const { uploadFileToCloud } = require("../services/storage.service");
const { generateImageTags } = require("../services/ai.service");
const fs = require("fs");
const User = require("../models/user.model");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");


async function uploadFile(req, res) {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    console.log("FILE:", req.file);

    const result = await uploadFileToCloud(file);
    let aiTags = [];


    if (file.mimetype.startsWith("image/")) {
      aiTags = result.tags || [];
      if (aiTags.length === 0) {
        aiTags = await generateImageTags(file.path, result.public_id);
      }
    }


    const existingFile = await File.findOne({ user: req.user.id, fileName: file.originalname, isTrash: false });
    let savedFile;

    if (existingFile) {
      try {
        const oldResourceType = existingFile.fileType?.startsWith("image/") ? "image"
          : existingFile.fileType?.startsWith("video/") ? "video" : "raw";
        await cloudinary.uploader.destroy(existingFile.publicId, { resource_type: oldResourceType });
      } catch (destroyErr) {
        console.warn("[uploadFile] failed to destroy previous file asset:", destroyErr.message);
      }

      existingFile.fileUrl = result.secure_url;
      existingFile.publicId = result.public_id;
      existingFile.fileType = file.mimetype;
      existingFile.size = file.size;
      existingFile.tags = aiTags;
      existingFile.isTrash = false;
      existingFile.trashedAt = null;
      savedFile = await existingFile.save();
    } else {
      savedFile = await File.create({
        user: req.user.id,
        fileName: file.originalname,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        fileType: file.mimetype,
        size: file.size,
        tags: aiTags,
      });
    }

    console.log("AI tags:", aiTags);
    res.status(201).json({ success: true, message: "File uploaded successfully", file: savedFile });
  } catch (error) {
    console.error("[uploadFile]", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    //  Delete local file after processing
    if (file?.path) {
      try {
        await fs.promises.unlink(file.path);
        console.log("Local file deleted");
      } catch (err) {
        console.error("Failed to delete local file:", err.message);
      }
    }
  }
}

async function getAllFiles(req, res) {
  try {
    const files = await File.find({ user: req.user.id, isTrash: false }).sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getStarredFiles(req, res) {
  try {
    const files = await File.find({ user: req.user.id, isStarred: true, isTrash: false }).sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getTrashFiles(req, res) {
  try {
    const files = await File.find({ user: req.user.id, isTrash: true }).sort({ updatedAt: -1 });
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getSharedFiles(req, res) {
  try {
    // Match files where the sharedWith array contains an entry with this user id
    const files = await File.find({ 'sharedWith.user': req.user.id, isTrash: false })
      .populate("user", "name email").sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function moveToTrash(req, res) {
  try {
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isTrash: true }, { new: true }
    );
    if (!file) return res.status(404).json({ success: false, message: "File not found" });
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function restoreFile(req, res) {
  try {
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isTrash: false }, { new: true }
    );
    if (!file) return res.status(404).json({ success: false, message: "File not found" });
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function renameFile(req, res) {
  try {
    const { fileName } = req.body;
    if (!fileName?.trim()) return res.status(400).json({ success: false, message: "File name is required" });
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { fileName: fileName.trim() }, { new: true }
    );
    if (!file) return res.status(404).json({ success: false, message: "File not found" });
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function toggleStar(req, res) {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: "File not found" });
    file.isStarred = !file.isStarred;
    await file.save();
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteFilePermanently(req, res) {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: "File not found" });
    try {
      const resourceType = file.fileType?.startsWith("image") ? "image"
        : file.fileType?.startsWith("video") ? "video" : "raw";
      await cloudinary.uploader.destroy(file.publicId, { resource_type: resourceType });
    } catch (cloudErr) {
      console.error("[deleteFilePermanently] Cloudinary error:", cloudErr.message);
    }
    await File.findByIdAndDelete(file._id);
    res.json({ success: true, message: "File deleted permanently" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function shareFile(req, res) {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ success: false, message: "Email is required" });
    const userToShare = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToShare) return res.status(404).json({ success: false, message: "User not found" });
    if (userToShare._id.toString() === req.user.id)
      return res.status(400).json({ success: false, message: "Cannot share with yourself" });

    const file = await File.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    const alreadyShared = file.sharedWith.some(entry => entry.user?.toString() === userToShare._id.toString());
    if (!alreadyShared) {
      file.sharedWith.push({ user: userToShare._id, permission: "view", sharedAt: new Date() });
      await file.save();
    }

    res.json({ success: true, message: `File shared with ${userToShare.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function generateShareLink(req, res) {
  try {
    const { expiresInHours = 48 } = req.body;
    const file = await File.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    const token = crypto.randomBytes(16).toString("hex");
    const hours = Math.max(1, Number(expiresInHours) || 48);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    file.shareToken = token;
    file.shareExpiry = expiresAt;
    await file.save();

    const shareUrl = `${req.protocol}://${req.get("host")}/api/files/public/${token}`;
    res.json({ success: true, shareUrl, expiresAt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function downloadFile(req, res) {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      isTrash: false,
      $or: [
        { user: req.user.id },
        { 'sharedWith.user': req.user.id }
      ]
    });
    if (!file) return res.status(404).json({ success: false, message: "File not found or access denied" });

    file.downloadCount = (file.downloadCount || 0) + 1;
    await file.save();

    res.json({ success: true, fileUrl: file.fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getPublicFileByToken(req, res) {
  try {
    const file = await File.findOne({
      shareToken: req.params.token,
      shareExpiry: { $gt: new Date() },
      isTrash: false,
    });
    if (!file) return res.status(404).json({ success: false, message: "Shared file not found or link expired" });
    return res.redirect(file.fileUrl);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function searchFiles(req, res) {
  try {
    const query = (req.query.query || "").trim();
    if (!query) return res.json({ success: true, files: [] });
    const files = await File.find({
      user: req.user.id, isTrash: false,
      $or: [
        { fileName: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
        { fileType: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getStorageStats(req, res) {
  try {
    const result = await File.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), isTrash: false } },
      { $group: { _id: null, totalSize: { $sum: "$size" }, count: { $sum: 1 } } },
    ]);
    const stats = result[0] || { totalSize: 0, count: 0 };
    const MAX_STORAGE = 15 * 1024 * 1024 * 1024;
    res.json({
      success: true,
      stats: {
        usedBytes: stats.totalSize,
        totalBytes: MAX_STORAGE,
        fileCount: stats.count,
        usedPercentage: ((stats.totalSize / MAX_STORAGE) * 100).toFixed(1),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  uploadFile,
  getAllFiles,
  getStarredFiles,
  getTrashFiles,
  getSharedFiles,
  moveToTrash,
  restoreFile,
  renameFile,
  toggleStar,
  deleteFilePermanently,
  shareFile,
  generateShareLink,
  downloadFile,
  getPublicFileByToken,
  searchFiles,
  getStorageStats,
};
