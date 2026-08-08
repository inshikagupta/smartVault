const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
        type: String,
        enum: ["upload", "download", "delete", "restore", "share", "rename", "move", "star", "unstar", "create_folder", "delete_folder"],
        required: true
    },
    targetType: { type: String, enum: ["file", "folder"], default: "file" },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String }
}, { timestamps: true });

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
